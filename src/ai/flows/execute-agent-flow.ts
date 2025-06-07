
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

      switch (currentNode.type) {
        case 'start':
          break;

        case 'sendMessage':
          if (currentNode.message) {
            messagesToSend.push(templatize(currentNode.message, currentContext));
          }
          break;

        case 'getUserInput':
          if (currentMessage && currentContext.waitingForInput === currentNode.id) {
            if (currentNode.variableName) {
              currentContext[currentNode.variableName] = currentMessage;
            }
            currentContext.waitingForInput = undefined; 
          } else if (!currentContext.waitingForInput) {
            if (currentNode.prompt) {
              messagesToSend.push(templatize(currentNode.prompt, currentContext));
            }
            currentContext.waitingForInput = currentNode.id; 
            return { messagesToSend, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished };
          }
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
                // messagesToSend.push("(System: Using knowledge from uploaded documents for this response.)");
              }
            }
            
            const llmResponse = await ai.generate({ prompt: populatedPrompt });
            currentContext[currentNode.outputVariable] = llmResponse.text;
          } else {
            messagesToSend.push(`(System: LLM node '${currentNode.id}' misconfigured - missing prompt or outputVariable)`);
          }
          break;
        
        case 'condition':
          messagesToSend.push(`(System: Condition node '${currentNode.id}' - evaluation placeholder)`);
          break;

        case 'apiCall':
           messagesToSend.push(`(System: API Call node '${currentNode.id}' - not implemented)`);
          break;

        case 'end':
          isFlowFinished = true;
          currentNodeId = undefined; 
          continue; 

        default:
          messagesToSend.push(`(System: Unknown node type '${(currentNode as any).type}' for node '${currentNode.id}')`);
      }
      
      let nextEdge: FlowEdge | undefined;
      if (currentNode.type === 'condition') {
        const conditionValue = "true"; 
        nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId && edge.condition === conditionValue);
        if (!nextEdge) { 
            nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId && !edge.condition);
        }
      } else {
        nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
      }

      if (nextEdge) {
        currentNodeId = nextEdge.target;
      } else {
        if (currentNode.type !== 'end') {
           messagesToSend.push(`(System: No outgoing edge from node '${currentNode.id}' and it's not an end node.)`);
        }
        currentNodeId = undefined; 
      }
    } 

    if (maxSteps <= 0) {
      error = "Flow execution exceeded maximum steps.";
    }

  } catch (e: any) {
    console.error("Error executing agent flow:", e);
    error = e.message || "An unexpected error occurred during flow execution.";
  }
  
  if (isFlowFinished || error) {
    currentContext.waitingForInput = undefined;
  }

  return { messagesToSend, updatedContext: currentContext, error, nextNodeId: currentContext.waitingForInput, isFlowFinished };
}

const agentJsonFlow = ai.defineFlow(
  {
    name: 'agentJsonFlow', 
    inputSchema: ExecuteAgentFlowInputSchema,
    outputSchema: ExecuteAgentFlowOutputSchema,
  },
  async (input) => {
    return executeAgentFlow(input);
  }
);
