
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
import type { FlowNode, FlowEdge, AgentFlowDefinition, FlowContext, KnowledgeItem } from '@/lib/types'; // Import types
import { AgentFlowDefinitionSchema, FlowContextSchema, KnowledgeItemSchema } from '@/lib/types'; // Import Zod schemas

// Input schema for the Genkit flow, using imported Zod schemas
const ExecuteAgentFlowInputSchema = z.object({
  flowDefinition: AgentFlowDefinitionSchema.describe("The JSON definition of the agent's conversational flow."),
  currentContext: FlowContextSchema.describe("The current state of conversation variables."),
  currentMessage: z.string().optional().describe("The user's latest input message, if any."),
  startNodeId: z.string().optional().describe("The ID of the node from which to start or resume execution. Defaults to 'start' node."),
  knowledgeItems: z.array(KnowledgeItemSchema).optional().describe("An array of knowledge items for the agent."),
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
  const { flowDefinition, currentMessage, knowledgeItems } = input;
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
      
      currentContext.currentNodeId = currentNode.id;
      let nextEdge: FlowEdge | undefined;

      switch (currentNode.type) {
        case 'start':
          // No specific action, just an entry point.
          break;

        case 'sendMessage':
          if (currentNode.message) {
            messagesToSend.push(templatize(currentNode.message, currentContext));
          }
          break;

        case 'getUserInput':
          if (currentMessage && currentContext.waitingForInput === currentNode.id) {
            // User has provided input for this node
            if (currentNode.variableName) {
              currentContext[currentNode.variableName] = currentMessage;
            }
            currentContext.waitingForInput = undefined; // Clear waiting state
          } else if (!currentContext.waitingForInput) {
            // This node is encountered for the first time in this turn, prompt user
            if (currentNode.prompt) {
              messagesToSend.push(templatize(currentNode.prompt, currentContext));
            }
            currentContext.waitingForInput = currentNode.id; // Set waiting state
            // Return immediately, wait for next user message
            return { messagesToSend, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished };
          }
          // If currentContext.waitingForInput is set but not for THIS node, it's an issue, but flow should proceed to find next edge.
          break;

        case 'callLLM':
          if (currentNode.llmPrompt && currentNode.outputVariable) {
            let populatedPrompt = templatize(currentNode.llmPrompt, currentContext);
            
            if (currentNode.useKnowledge && knowledgeItems && knowledgeItems.length > 0) {
              const knowledgeSummaries = knowledgeItems
                .map(item => item.summary)
                .filter(Boolean) // Remove any undefined/empty summaries
                .join("\n\n---\n\n");
              if (knowledgeSummaries) {
                populatedPrompt = `Relevant Information from Knowledge Base:\n${knowledgeSummaries}\n\nOriginal Prompt:\n${populatedPrompt}`;
              }
            }
            
            const llmResponse = await ai.generate({ prompt: populatedPrompt });
            currentContext[currentNode.outputVariable] = llmResponse.text;
          } else {
            messagesToSend.push(`(System: LLM node '${currentNode.id}' misconfigured - missing prompt or outputVariable)`);
          }
          break;
        
        case 'condition':
          const variableName = currentNode.conditionVariable;
          if (variableName && currentContext[variableName] !== undefined) {
            const valueToMatch = String(currentContext[variableName]);
            // Find an edge whose 'condition' property matches the value
            nextEdge = flowDefinition.edges.find(
              (edge) => edge.source === currentNodeId && edge.condition === valueToMatch
            );
            // If no specific match, look for a default/fallback edge (condition is empty or not set)
            if (!nextEdge) {
              nextEdge = flowDefinition.edges.find(
                (edge) => edge.source === currentNodeId && (!edge.condition || edge.condition === "")
              );
            }
          } else {
            // If conditionVariable is not set or not in context, try to find a default edge
            nextEdge = flowDefinition.edges.find(
              (edge) => edge.source === currentNodeId && (!edge.condition || edge.condition === "")
            );
            if (variableName && currentContext[variableName] === undefined) {
                 messagesToSend.push(`(System: Condition node '${currentNode.id}' - variable '${variableName}' not found in context. Attempting default path.)`);
            } else if (!variableName) {
                 messagesToSend.push(`(System: Condition node '${currentNode.id}' - 'conditionVariable' not specified. Attempting default path.)`);
            }
          }
          // The actual assignment of currentNodeId happens after the switch statement
          // based on the found nextEdge. So, we 'continue' the outer loop here
          // if we've determined nextEdge within the condition block.
          // The common edge finding logic below will handle if nextEdge is still undefined.
          break; // Break from switch, common edge logic will apply if nextEdge isn't set by condition.

        case 'apiCall':
           messagesToSend.push(`(System: API Call node '${currentNode.id}' - not implemented)`);
          break;

        case 'end':
          isFlowFinished = true;
          currentNodeId = undefined; // Signal to stop the loop
          continue; // Skip normal edge finding

        default:
          messagesToSend.push(`(System: Unknown node type '${(currentNode as any).type}' for node '${currentNode.id}')`);
      }
      
      // Find the next edge if not already determined by a condition node
      if (!nextEdge && currentNode.type !== 'condition') { // Condition node already handled its edge finding
        nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
      }


      if (nextEdge) {
        currentNodeId = nextEdge.target;
      } else {
        if (currentNode.type !== 'end') { // Don't warn if it's an end node with no outgoing edge
           messagesToSend.push(`(System: No outgoing edge from node '${currentNode.id}' and it's not an end node. Flow may be stuck.)`);
        }
        currentNodeId = undefined; // Stop the loop if no path forward
      }
    } 

    if (maxSteps <= 0) {
      error = "Flow execution exceeded maximum steps.";
    }

  } catch (e: any) {
    console.error("Error executing agent flow:", e);
    error = e.message || "An unexpected error occurred during flow execution.";
  }
  
  // If flow finished or errored, ensure no input is awaited.
  if (isFlowFinished || error) {
    currentContext.waitingForInput = undefined;
  }

  return { 
    messagesToSend, 
    updatedContext: currentContext, 
    error, 
    nextNodeId: currentContext.waitingForInput, // This reflects if a getUserInput node is now active
    isFlowFinished 
  };
}

// This defines the Genkit flow itself, which wraps our main executeAgentFlow logic.
const agentJsonFlow = ai.defineFlow(
  {
    name: 'agentJsonFlow', 
    inputSchema: ExecuteAgentFlowInputSchema,
    outputSchema: ExecuteAgentFlowOutputSchema,
  },
  async (input) => {
    // The actual execution logic is in the exported function `executeAgentFlow`
    // This wrapper makes it a Genkit-managed flow.
    return executeAgentFlow(input);
  }
);

// Note: The `agentJsonFlow` constant defined by `ai.defineFlow` is not exported.
// Only the `executeAgentFlow` function and its related types are.
// This is compliant with 'use server' directive limitations.
