
'use server';
/**
 * @fileOverview Genkit flow to execute a JSON-defined agent conversation flow.
 *
 * - executeAgentFlow - Main function to process the flow.
 * - ExecuteAgentFlowInput - Input schema for the flow.
 * - ExecuteAgentFlowOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { FlowNode, FlowEdge, AgentFlowDefinition, FlowContext } from '@/lib/types'; // Import types
import { AgentFlowDefinitionSchema, FlowContextSchema } from '@/lib/types'; // Import Zod schemas

// Input schema for the Genkit flow, using imported Zod schemas
const ExecuteAgentFlowInputSchema = z.object({
  flowDefinition: AgentFlowDefinitionSchema.describe("The JSON definition of the agent's conversational flow."),
  currentContext: FlowContextSchema.describe("The current state of conversation variables."),
  currentMessage: z.string().optional().describe("The user's latest input message, if any."),
  startNodeId: z.string().optional().describe("The ID of the node from which to start or resume execution. Defaults to 'start' node."),
});
export type ExecuteAgentFlowInput = z.infer<typeof ExecuteAgentFlowInputSchema>;

// Output schema for the Genkit flow, using imported Zod schemas
const ExecuteAgentFlowOutputSchema = z.object({
  messagesToSend: z.array(z.string()).describe("An array of messages the agent should send to the user."),
  updatedContext: FlowContextSchema.describe("The conversation context after executing the current step(s)."),
  nextNodeId: z.string().optional().describe("If the flow is waiting for user input, this is the ID of the node to resume from. Otherwise, undefined."),
  error: z.string().optional().describe("An error message if the flow execution failed."),
  isFlowFinished: z.boolean().describe("True if the flow reached an 'end' node.")
});
export type ExecuteAgentFlowOutput = z.infer<typeof ExecuteAgentFlowOutputSchema>;


// Helper to replace {{variables}} in a string
function templatize(templateString: string, context: FlowContext): string {
  if (!templateString) return "";
  return templateString.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return context[varName] !== undefined ? String(context[varName]) : match;
  });
}

export async function executeAgentFlow(input: ExecuteAgentFlowInput): Promise<ExecuteAgentFlowOutput> {
  const { flowDefinition, currentMessage } = input;
  let { currentContext, startNodeId } = input;

  const messagesToSend: string[] = [];
  let error: string | undefined = undefined;
  let isFlowFinished = false;

  try {
    let currentNodeId = startNodeId || flowDefinition.nodes.find(n => n.type === 'start')?.id;
    if (!currentNodeId) {
      return { messagesToSend, updatedContext: currentContext, error: "No start node found or specified.", isFlowFinished: true };
    }

    let maxSteps = 20; // Safety break for loops

    while (currentNodeId && maxSteps > 0) {
      maxSteps--;
      const currentNode = flowDefinition.nodes.find(n => n.id === currentNodeId);

      if (!currentNode) {
        error = `Node with ID ${currentNodeId} not found.`;
        break;
      }
      
      // Store current node in context for potential resume/debug
      currentContext.currentNodeId = currentNode.id;

      switch (currentNode.type) {
        case 'start':
          // Start node usually just transitions.
          break;

        case 'sendMessage':
          if (currentNode.message) {
            messagesToSend.push(templatize(currentNode.message, currentContext));
          }
          break;

        case 'getUserInput':
          if (currentMessage && currentContext.waitingForInput === currentNode.id) {
            // We were waiting for input for this node, and we got it.
            if (currentNode.variableName) {
              currentContext[currentNode.variableName] = currentMessage;
            }
            currentContext.waitingForInput = undefined; // Clear the waiting flag
            // currentMessage = undefined; // Consume the message for this node.
          } else if (!currentContext.waitingForInput) {
             // This node requires user input, and we don't have it yet for *this turn* or *this node*.
            if (currentNode.prompt) {
              messagesToSend.push(templatize(currentNode.prompt, currentContext));
            }
            currentContext.waitingForInput = currentNode.id; // Set waiting flag
            return { messagesToSend, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished };
          }
          // If we are here, it means we either got input or this node was already processed in a previous turn.
          // If currentMessage was for a *previous* getUserInput node, it should have been consumed.
          break;

        case 'callLLM':
          if (currentNode.llmPrompt && currentNode.outputVariable) {
            const populatedPrompt = templatize(currentNode.llmPrompt, currentContext);
            // Using the globally configured model in ai.ts
            const llmResponse = await ai.generate({ prompt: populatedPrompt });
            currentContext[currentNode.outputVariable] = llmResponse.text;
          } else {
            messagesToSend.push(`(System: LLM node '${currentNode.id}' misconfigured - missing prompt or outputVariable)`);
          }
          break;
        
        case 'condition':
          // Simplified: expects edges to have a "condition" field that matches "true" or "false"
          // For a real implementation, currentNode.conditionExpression would be evaluated against currentContext
          // e.g., using a safe expression evaluator like Jexl or similar.
          // For now, we'll assume the condition itself is resolved externally or by edge properties.
          // The logic for choosing the next edge for a 'condition' node is handled in edge finding.
          messagesToSend.push(`(System: Condition node '${currentNode.id}' - evaluation placeholder)`);
          break;

        case 'apiCall':
          // Placeholder for API call logic
           messagesToSend.push(`(System: API Call node '${currentNode.id}' - not implemented)`);
          // Example:
          // if (currentNode.apiUrl && currentNode.apiOutputVariable) {
          //   try {
          //     const response = await fetch(templatize(currentNode.apiUrl, currentContext), { method: currentNode.apiMethod || 'GET' });
          //     const data = await response.json();
          //     currentContext[currentNode.apiOutputVariable] = data;
          //   } catch (e) {
          //     currentContext[currentNode.apiOutputVariable] = { error: 'API call failed', details: (e as Error).message };
          //   }
          // }
          break;

        case 'end':
          isFlowFinished = true;
          currentNodeId = undefined; // Stop the loop
          continue; // Skip edge finding for 'end' node

        default:
          messagesToSend.push(`(System: Unknown node type '${(currentNode as any).type}' for node '${currentNode.id}')`);
      }
      
      // Determine the next node
      let nextEdge: FlowEdge | undefined;
      if (currentNode.type === 'condition') {
        // For condition nodes, find an edge whose 'condition' matches the evaluation (simplified)
        // Here, you would evaluate currentNode.conditionExpression against currentContext
        const conditionValue = "true"; // Placeholder for actual evaluation result
        nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId && edge.condition === conditionValue);
        if (!nextEdge) { // Fallback to an edge without a condition if specific one not found
            nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId && !edge.condition);
        }
      } else {
        // For other nodes, find the first (or only) outgoing edge
        nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
      }


      if (nextEdge) {
        currentNodeId = nextEdge.target;
      } else {
        if (currentNode.type !== 'end') {
           messagesToSend.push(`(System: No outgoing edge from node '${currentNode.id}' and it's not an end node.)`);
        }
        currentNodeId = undefined; // End of flow or dead end
      }
    } // end while loop

    if (maxSteps <= 0) {
      error = "Flow execution exceeded maximum steps.";
    }

  } catch (e: any) {
    console.error("Error executing agent flow:", e);
    error = e.message || "An unexpected error occurred during flow execution.";
  }
  
  // Clear waitingForInput if flow finished or errored
  if (isFlowFinished || error) {
    currentContext.waitingForInput = undefined;
  }


  return { messagesToSend, updatedContext: currentContext, error, nextNodeId: currentContext.waitingForInput, isFlowFinished };
}

// Defining the Genkit flow (wrapper around the main logic)
const agentJsonFlow = ai.defineFlow(
  {
    name: 'agentJsonFlow', 
    inputSchema: ExecuteAgentFlowInputSchema,  // Uses locally defined schema (which internally uses imported schemas)
    outputSchema: ExecuteAgentFlowOutputSchema, // Uses locally defined schema (which internally uses imported schemas)
  },
  async (input) => {
    return executeAgentFlow(input); // Calls the exported async function
  }
);
