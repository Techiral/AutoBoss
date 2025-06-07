
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

// Helper function to find the next edge based on various criteria
function findNextEdge(currentNodeId: string, flowDefinition: AgentFlowDefinition, preferredEdgeType?: FlowEdge['edgeType']): FlowEdge | undefined {
    const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);
    if (preferredEdgeType) {
        const typedEdge = outgoingEdges.find(edge => edge.edgeType === preferredEdgeType);
        if (typedEdge) return typedEdge;
    }
    // Fallback to default or first available edge
    return outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.edgeType) || outgoingEdges[0];
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
          nextEdge = findNextEdge(currentNode.id, flowDefinition);
          break;

        case 'sendMessage':
          if (currentNode.message) {
            messagesToSend.push(templatize(currentNode.message, currentContext));
          }
          nextEdge = findNextEdge(currentNode.id, flowDefinition);
          break;

        case 'getUserInput':
          if (currentMessage && currentContext.waitingForInput === currentNode.id) {
            if (currentNode.variableName) {
              currentContext[currentNode.variableName] = currentMessage;
            }
            currentContext.waitingForInput = undefined; 
            // Basic validation placeholder (true for now)
            const isValid = true; // Replace with actual validation logic if currentNode.validationRules
            if (isValid) {
                 nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default'); // or 'success' if that's used
            } else {
                 nextEdge = findNextEdge(currentNode.id, flowDefinition, 'invalid');
                 if (!nextEdge) messagesToSend.push(`(System: Input for ${currentNode.id} was invalid, but no 'invalid' path defined.)`);
            }
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
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
          } else {
            messagesToSend.push(`(System: LLM node '${currentNode.id}' misconfigured - missing prompt or outputVariable)`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
          }
          break;
        
        case 'condition':
          const variableName = currentNode.conditionVariable;
          const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);

          if (!variableName || currentContext[variableName] === undefined) {
            messagesToSend.push(`(System: Condition node '${currentNode.id}' - variable '${variableName || 'undefined'}' not found or not set. Attempting default path.)`);
            nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
          } else {
            const valueToEvaluate = String(currentContext[variableName]).toLowerCase();

            if (currentNode.useLLMForDecision) {
              const edgeConditionLabels = outgoingEdges
                .map(edge => edge.condition)
                .filter((condition): condition is string => typeof condition === 'string' && condition.trim() !== ""); 
              
              if (edgeConditionLabels.length > 0) {
                const llmPromptForDecision = `User input: "${valueToEvaluate}". Based on this input, which of the following categories or intents best describes it? Categories: ${JSON.stringify(edgeConditionLabels)}. Respond with *only* the text of the chosen category. If none directly match, respond with the category for a general or default fallback if available (usually the one with an empty condition text).`;
                try {
                  const decisionResponse = await ai.generate({ prompt: llmPromptForDecision });
                  let chosenCategory = decisionResponse.text?.trim().toLowerCase();
                  
                  nextEdge = outgoingEdges.find(edge => edge.condition?.toLowerCase() === chosenCategory);
                  if (!nextEdge) { 
                     messagesToSend.push(`(System: LLM decision '${chosenCategory}' did not match any edge condition directly for node '${currentNode.id}'. Trying default.)`);
                    nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
                  }
                } catch (llmError: any) {
                  messagesToSend.push(`(System: LLM decision error for node '${currentNode.id}': ${llmError.message}. Trying default.)`);
                  nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
                }
              } else {
                 messagesToSend.push(`(System: Condition node '${currentNode.id}' set to useLLMForDecision, but no valid edge conditions found. Trying default.)`);
                nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
              }
            } else { 
              nextEdge = outgoingEdges.find(edge => edge.condition?.toLowerCase() === valueToEvaluate);
              if (!nextEdge) {
                nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
              }
            }
          }
          break;

        case 'apiCall': // HTTP Request (Placeholder)
           messagesToSend.push(`(System: HTTP Request (apiCall) node '${currentNode.id}' - Placeholder. Would call ${currentNode.apiMethod || 'GET'} ${templatize(currentNode.apiUrl || '', currentContext)})`);
           // Placeholder: In a real scenario, make HTTP call, then based on response (success/error):
           // if (success) { currentContext[currentNode.apiOutputVariable] = response_data; nextEdge = findNextEdge(currentNode.id, flowDefinition, 'success'); }
           // else { nextEdge = findNextEdge(currentNode.id, flowDefinition, 'error'); }
           currentContext[currentNode.apiOutputVariable || 'apiResult'] = "Placeholder API Response";
           nextEdge = findNextEdge(currentNode.id, flowDefinition, 'success');
           if (!nextEdge) nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default');
          break;
        
        case 'action': // Placeholder
          messagesToSend.push(`(System: Action node '${currentNode.id}' - Placeholder. Action: ${currentNode.actionName || 'N/A'})`);
          // In real implementation:
          // const actionResult = await executeRegisteredAction(currentNode.actionName, currentNode.actionInputArgs, currentContext);
          // Map actionResult to context using currentNode.actionOutputVarMap
          nextEdge = findNextEdge(currentNode.id, flowDefinition);
          break;

        case 'code': // Placeholder - NO ACTUAL CODE EXECUTION
            messagesToSend.push(`(System: Code (JS) node '${currentNode.id}' - Placeholder. Script: '${currentNode.codeScript?.substring(0, 50)}...')`);
            // This is a highly simplified placeholder. Real JS execution is complex and needs sandboxing.
            if (currentNode.codeScript && currentNode.codeReturnVarMap) {
                // Extremely basic simulation for a return object: `return { "key": "value" };`
                const match = currentNode.codeScript.match(/return\s*{\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']\s*};?/);
                if (match) {
                    const returnKey = match[1];
                    const returnValue = match[2];
                    for (const [contextVar, scriptVar] of Object.entries(currentNode.codeReturnVarMap)) {
                        if (scriptVar === returnKey) {
                            currentContext[contextVar] = returnValue;
                            messagesToSend.push(`(System: Code node simulated setting context.${contextVar} to "${returnValue}")`);
                        }
                    }
                }
            }
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'qnaLookup': // Placeholder, basic keyword check
            messagesToSend.push(`(System: Q&A Lookup node '${currentNode.id}' - Placeholder)`);
            let found = false;
            const query = currentNode.qnaQueryVariable ? currentContext[currentNode.qnaQueryVariable] as string : currentMessage;

            if (query && knowledgeItems && knowledgeItems.length > 0) {
                const lowerQuery = query.toLowerCase();
                for (const item of knowledgeItems) {
                    if (item.summary?.toLowerCase().includes(lowerQuery) || item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))) {
                        found = true;
                        if (currentNode.qnaOutputVariable) {
                            currentContext[currentNode.qnaOutputVariable] = item.summary || "Found relevant information.";
                        }
                        break;
                    }
                }
            }
            if (found) {
                nextEdge = findNextEdge(currentNode.id, flowDefinition, 'found');
            } else {
                if (currentNode.qnaOutputVariable) {
                     currentContext[currentNode.qnaOutputVariable] = currentNode.qnaFallbackText || "No specific answer found in knowledge base.";
                }
                nextEdge = findNextEdge(currentNode.id, flowDefinition, 'notFound');
            }
            if (!nextEdge) nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default'); // Fallback
            break;

        case 'wait':
            messagesToSend.push(`(System: Wait node '${currentNode.id}' starting for ${currentNode.waitDurationMs || 0}ms)`);
            if (currentNode.waitDurationMs && currentNode.waitDurationMs > 0) {
                await new Promise(resolve => setTimeout(resolve, currentNode.waitDurationMs));
            }
            messagesToSend.push(`(System: Wait node '${currentNode.id}' finished)`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'transition': // Placeholder
            messagesToSend.push(`(System: Transition node '${currentNode.id}' - Placeholder. Would transition to flow '${currentNode.transitionTargetFlowId}')`);
            // This would involve a more complex mechanism to switch flow contexts or call another flow executor.
            // For now, it might act like an end node or proceed if an edge is defined (though typically it wouldn't have one).
            isFlowFinished = true; // Or treat as end for now
            currentNodeId = undefined;
            continue;

        case 'agentSkill': // Placeholder
            messagesToSend.push(`(System: Agent Skill node '${currentNode.id}' - Placeholder. Skill: ${currentNode.agentSkillId || 'N/A'})`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'end':
          if (currentNode.endOutputVariable && currentContext[currentNode.endOutputVariable] !== undefined) {
            messagesToSend.push(`(System: Flow ended. Output from '${currentNode.endOutputVariable}': ${currentContext[currentNode.endOutputVariable]})`);
          } else if (currentNode.endOutputVariable) {
            messagesToSend.push(`(System: Flow ended. Output variable '${currentNode.endOutputVariable}' was specified but not found in context.)`);
          } else {
            messagesToSend.push("(System: Flow ended.)");
          }
          isFlowFinished = true;
          currentNodeId = undefined; 
          continue; 

        default:
          // This is a way to handle unknown node types if FlowNodeType in studio.tsx diverges from lib/types.ts
          // const exhaustiveCheck: never = currentNode.type; 
          messagesToSend.push(`(System: Unknown node type '${(currentNode as any).type}' encountered for node '${currentNode.id}')`);
          nextEdge = findNextEdge(currentNode.id, flowDefinition); // Try to find a default edge
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

