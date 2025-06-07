
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
            // TODO: Add validation logic here based on currentNode.validationRules and currentNode.inputType
            // If invalid, find an edge with edgeType 'invalid'
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
                .filter(Boolean) 
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
          const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);

          if (!variableName || currentContext[variableName] === undefined) {
            messagesToSend.push(`(System: Condition node '${currentNode.id}' - variable '${variableName || 'undefined'}' not found or not set. Attempting default path.)`);
            nextEdge = outgoingEdges.find(edge => !edge.condition || edge.condition === "" || edge.edgeType === 'default');
          } else {
            const valueToEvaluate = String(currentContext[variableName]);

            if (currentNode.useLLMForDecision) {
              const edgeConditionLabels = outgoingEdges
                .map(edge => edge.condition)
                .filter((condition): condition is string => typeof condition === 'string' && condition !== ""); 
              
              if (edgeConditionLabels.length > 0) {
                const llmPromptForDecision = `User input: "${valueToEvaluate}". Based on this input, which of the following categories or intents best describes it? Categories: ${JSON.stringify(edgeConditionLabels)}. Respond with *only* the text of the chosen category. If none directly match, try to find the closest one or respond with the category for a general or default fallback if available.`;
                try {
                  const decisionResponse = await ai.generate({ prompt: llmPromptForDecision });
                  const chosenCategory = decisionResponse.text?.trim();
                  
                  nextEdge = outgoingEdges.find(edge => edge.condition === chosenCategory);
                  if (!nextEdge) { 
                     messagesToSend.push(`(System: LLM decision '${chosenCategory}' did not match any edge condition directly for node '${currentNode.id}'. Trying default.)`);
                    nextEdge = outgoingEdges.find(edge => !edge.condition || edge.condition === "" || edge.edgeType === 'default');
                  }
                } catch (llmError: any) {
                  messagesToSend.push(`(System: LLM decision error for node '${currentNode.id}': ${llmError.message}. Trying default.)`);
                  nextEdge = outgoingEdges.find(edge => !edge.condition || edge.condition === "" || edge.edgeType === 'default');
                }
              } else {
                 messagesToSend.push(`(System: Condition node '${currentNode.id}' set to useLLMForDecision, but no valid edge conditions found. Trying default.)`);
                nextEdge = outgoingEdges.find(edge => !edge.condition || edge.condition === "" || edge.edgeType === 'default');
              }
            } else { 
              // Standard string matching from expressions (currentNode.conditionExpressions)
              // This part needs more advanced expression evaluation if using JS/Nunjucks
              // For now, simple string match on edge.condition
              nextEdge = outgoingEdges.find(edge => edge.condition === valueToEvaluate);
              if (!nextEdge) {
                nextEdge = outgoingEdges.find(edge => !edge.condition || edge.condition === "" || edge.edgeType === 'default');
              }
            }
          }
          break;

        case 'apiCall': // HTTP Request
           messagesToSend.push(`(System: HTTP Request (apiCall) node '${currentNode.id}' - placeholder execution)`);
           // Placeholder: find success edge or default
           nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId && (edge.edgeType === 'success' || !edge.edgeType));
          break;
        
        case 'action':
          messagesToSend.push(`(System: Action node '${currentNode.id}' - placeholder execution)`);
          nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
          break;
        case 'code':
          messagesToSend.push(`(System: Code (JS) node '${currentNode.id}' - placeholder execution)`);
          // In real implementation: execute currentNode.codeScript
          // For now, just find the next edge.
          nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
          break;
        case 'qnaLookup':
          messagesToSend.push(`(System: Q&A Lookup node '${currentNode.id}' - placeholder execution)`);
          // Placeholder: find 'found' or 'notFound' edge or default
          nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId && (edge.edgeType === 'found' || !edge.edgeType));
          break;
        case 'wait':
          messagesToSend.push(`(System: Wait node '${currentNode.id}' for ${currentNode.waitDurationMs || 0}ms - placeholder, no actual delay)`);
          // In real implementation: await new Promise(resolve => setTimeout(resolve, currentNode.waitDurationMs));
          nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
          break;
        case 'transition':
          messagesToSend.push(`(System: Transition node '${currentNode.id}' to flow '${currentNode.transitionTargetFlowId}' - placeholder)`);
          // This would involve a more complex mechanism to switch flow contexts or call another flow executor.
          // For now, it might act like an end node or proceed if an edge is defined (though typically it wouldn't have one).
          isFlowFinished = true; // Or treat as end for now
          currentNodeId = undefined;
          continue;
        case 'agentSkill':
          messagesToSend.push(`(System: Agent Skill node '${currentNode.id}' - placeholder execution)`);
          nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
          break;

        case 'end':
          if (currentNode.endOutputVariable && currentContext[currentNode.endOutputVariable]) {
            messagesToSend.push(`(System: Flow ended. Output from '${currentNode.endOutputVariable}': ${currentContext[currentNode.endOutputVariable]})`);
          } else {
            messagesToSend.push("(System: Flow ended.)");
          }
          isFlowFinished = true;
          currentNodeId = undefined; 
          continue; 

        default:
          // This is a way to handle unknown node types if FlowNodeType in studio.tsx diverges from lib/types.ts
          const exhaustiveCheck: never = currentNode.type; 
          messagesToSend.push(`(System: Unknown node type encountered for node '${currentNode.id}')`);
      }
      
      if (!nextEdge && currentNode.type !== 'condition' && currentNode.type !== 'end') {
        // For non-conditional, non-end nodes, there should typically be one outgoing edge.
        // If we didn't find one above (e.g. for new placeholder types), try to find any default edge.
        nextEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
      }


      if (nextEdge) {
        currentNodeId = nextEdge.target;
      } else {
        if (currentNode.type !== 'end' && !isFlowFinished) { 
           messagesToSend.push(`(System: No outgoing edge from node '${currentNode.id}' and it's not an end node. Flow may be stuck.)`);
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

  return { 
    messagesToSend, 
    updatedContext: currentContext, 
    error, 
    nextNodeId: currentContext.waitingForInput, 
    isFlowFinished 
  };
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

