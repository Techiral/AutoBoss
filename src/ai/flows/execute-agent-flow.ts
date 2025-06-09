
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
import type { FlowNode, FlowEdge, AgentFlowDefinition, FlowContext, KnowledgeItem, Agent } from '@/lib/types'; 
import { AgentFlowDefinitionSchema, FlowContextSchema, KnowledgeItemSchema } from '@/lib/types'; 

const ExecuteAgentFlowInputSchema = z.object({
  flowDefinition: AgentFlowDefinitionSchema.describe("The JSON definition of the agent's conversational flow."),
  currentContext: FlowContextSchema.describe("The current state of conversation variables."),
  currentMessage: z.string().optional().describe("The user's latest input message, if any."),
  startNodeId: z.string().optional().describe("The ID of the node from which to start or resume execution. Defaults to 'start' node."),
  knowledgeItems: z.array(KnowledgeItemSchema).optional().describe("An array of knowledge items for the agent."),
  agent: z.custom<Agent>().optional().describe("The full agent object, for persona/role context."),
});
export type ExecuteAgentFlowInput = z.infer<typeof ExecuteAgentFlowInputSchema>;

const ExecuteAgentFlowOutputSchema = z.object({
  messagesToSend: z.array(z.string()).describe("An array of messages the agent should send to the user."),
  debugLog: z.array(z.string()).optional().describe("Internal system messages for debugging flow execution."),
  updatedContext: FlowContextSchema.describe("The conversation context after executing the current step(s)."),
  nextNodeId: z.string().optional().describe("If the flow is waiting for user input, this is the ID of the node to resume from. Otherwise, undefined."),
  error: z.string().optional().describe("An error message if the flow execution failed."),
  isFlowFinished: z.boolean().describe("True if the flow reached an 'end' node.")
});
export type ExecuteAgentFlowOutput = z.infer<typeof ExecuteAgentFlowOutputSchema>;


function templatize(templateString: string, context: FlowContext): string {
  if (!templateString) return "";
  // Ensure conversationHistory is always an array before joining
  const safeContext = {
    ...context,
    conversationHistory: Array.isArray(context.conversationHistory) ? context.conversationHistory.join('\n') : ''
  };
  return templateString.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return safeContext[varName] !== undefined ? String(safeContext[varName]) : match;
  });
}

function findNextEdge(currentNodeId: string, flowDefinition: AgentFlowDefinition, preferredEdgeType?: FlowEdge['edgeType']): FlowEdge | undefined {
    const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);
    if (preferredEdgeType) {
        const typedEdge = outgoingEdges.find(edge => edge.edgeType === preferredEdgeType);
        if (typedEdge) return typedEdge;
    }
    // Prioritize default edges that are explicitly marked or have no condition
    const explicitDefault = outgoingEdges.find(edge => edge.edgeType === 'default');
    if (explicitDefault) return explicitDefault;
    const noConditionEdge = outgoingEdges.find(edge => !edge.condition || edge.condition.trim() === "");
    if (noConditionEdge) return noConditionEdge;
    
    // Fallback to any other edge if no specific default found (should be rare if flows are well-designed)
    return outgoingEdges[0];
}


export async function executeAgentFlow(input: ExecuteAgentFlowInput): Promise<ExecuteAgentFlowOutput> {
  const { flowDefinition, currentMessage, knowledgeItems, agent } = input;
  let { currentContext, startNodeId } = input;

  const messagesToSend: string[] = [];
  const debugLog: string[] = [];
  let error: string | undefined = undefined;
  let isFlowFinished = false;

  // Ensure conversationHistory is an array
  if (!currentContext.conversationHistory || !Array.isArray(currentContext.conversationHistory)) {
    currentContext.conversationHistory = [];
  }

  const agentPersonaSystemMessage = agent?.generatedPersona ? `You are ${agent.generatedName || agent.name}. Your persona: ${agent.generatedPersona}. Your role: ${agent.role || 'an AI assistant'}.` : '';

  try {
    let currentNodeId = startNodeId || flowDefinition.nodes.find(n => n.type === 'start')?.id;
    if (!currentNodeId) {
      return { messagesToSend, debugLog, updatedContext: currentContext, error: "No start node found or specified.", isFlowFinished: true };
    }
    debugLog.push(`(System: Starting flow from step '${flowDefinition.nodes.find(n=>n.id===currentNodeId)?.label || currentNodeId}')`);

    let maxSteps = 20; 

    while (currentNodeId && maxSteps > 0) {
      maxSteps--;
      const currentNode = flowDefinition.nodes.find(n => n.id === currentNodeId);

      if (!currentNode) {
        error = `Step with ID ${currentNodeId} not found.`;
        debugLog.push(`(System: Error - ${error})`);
        break;
      }
      
      currentContext.currentNodeId = currentNode.id; 
      debugLog.push(`(System: Executing step '${currentNode.label || currentNode.id}' (Type: '${currentNode.type}'))`);
      let nextEdge: FlowEdge | undefined;

      switch (currentNode.type) {
        case 'start':
          nextEdge = findNextEdge(currentNode.id, flowDefinition);
          break;

        case 'sendMessage':
          if (currentNode.message) {
            const templatedMessage = templatize(currentNode.message, currentContext);
            messagesToSend.push(templatedMessage);
            currentContext.conversationHistory.push(`Agent: ${templatedMessage}`);
            debugLog.push(`(System: Step '${currentNode.label}' sent message: "${templatedMessage.substring(0,70)}...")`);
          }
          nextEdge = findNextEdge(currentNode.id, flowDefinition);
          break;

        case 'getUserInput':
          if (currentMessage && currentContext.waitingForInput === currentNode.id) {
            debugLog.push(`(System: Step '${currentNode.label}' received user input: "${currentMessage}". Saved to '{{${currentNode.variableName}}}'.)`);
            if (currentNode.variableName) {
              currentContext[currentNode.variableName] = currentMessage;
            }
            currentContext.conversationHistory.push(`User: ${currentMessage}`);
            currentContext.waitingForInput = undefined; 
            // TODO: Add actual validation logic here if/when implemented
            const isValid = true; 
            if (isValid) {
                 nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default');
            } else {
                 nextEdge = findNextEdge(currentNode.id, flowDefinition, 'invalid');
                 if (!nextEdge) debugLog.push(`(System: Input for '${currentNode.label}' was invalid, but no 'invalid' path defined.)`);
            }
          } else if (!currentContext.waitingForInput) { // First time reaching this node in the current turn
            if (currentNode.prompt) {
              const templatedPrompt = templatize(currentNode.prompt, currentContext);
              messagesToSend.push(templatedPrompt);
              currentContext.conversationHistory.push(`Agent: ${templatedPrompt}`);
              debugLog.push(`(System: Step '${currentNode.label}' is now asking '${templatedPrompt.substring(0,70)}...' and waiting for user input. Will save to '{{${currentNode.variableName}}}'.)`);
            }
            currentContext.waitingForInput = currentNode.id; 
            return { messagesToSend, debugLog, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished }; // Stop execution and wait for user
          } else { // Still waiting for input, but this call didn't provide it
            debugLog.push(`(System: Stuck at Ask User step '${currentNode.label}', still waiting for message. This call had no currentMessage for this step.)`);
            return { messagesToSend, debugLog, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished };
          }
          break;

        case 'callLLM':
          if (currentNode.llmPrompt && currentNode.outputVariable) {
            let populatedNodePrompt = templatize(currentNode.llmPrompt, currentContext);
            let knowledgePreamble = "";
            let conversationHistorySnippet = "";

            if (currentContext.conversationHistory && Array.isArray(currentContext.conversationHistory) && currentContext.conversationHistory.length > 0) {
              const history = currentContext.conversationHistory as string[];
              const lastNTurns = history.slice(-10); 
              if (lastNTurns.length > 0) {
                conversationHistorySnippet = `\n\n--- CONVERSATION HISTORY (Last few turns) ---\n${lastNTurns.join('\n')}\n--- END CONVERSATION HISTORY ---`;
              }
            }
            
            if (currentNode.useKnowledge && knowledgeItems && knowledgeItems.length > 0) {
              const knowledgeSummaries = knowledgeItems
                .map(item => `ID: ${item.id}\nSource: ${item.fileName}\nSummary: ${item.summary}\nKeywords: ${item.keywords?.join(', ') || 'N/A'}`)
                .filter(Boolean) 
                .join("\n\n---\n\n");
              
              if (knowledgeSummaries) {
                knowledgePreamble = `\nYou have access to the following information from a knowledge base. Review it and use it if relevant to the Original Prompt.\n--- AVAILABLE KNOWLEDGE ITEMS START ---\n${knowledgeSummaries}\n--- AVAILABLE KNOWLEDGE ITEMS END ---`;
              }
            }
            
            const fullPromptForLLM = `${agentPersonaSystemMessage ? agentPersonaSystemMessage + '\n\n' : ''}${knowledgePreamble ? knowledgePreamble + '\n\n' : ''}Original Prompt for this step:\n${populatedNodePrompt}${conversationHistorySnippet ? conversationHistorySnippet + '\n\n' : ''}\n\nBased on the Original Prompt, your persona, any relevant knowledge, and the conversation history provided, generate the response for this step.`;
            
            debugLog.push(`(System: Calling AI for step '${currentNode.label}'. Prompt starts with: "${fullPromptForLLM.substring(0, 100)}...")`);

            const llmResponse = await ai.generate({ prompt: fullPromptForLLM });
            const aiResponseText = llmResponse.text || "";
            currentContext[currentNode.outputVariable] = aiResponseText;
            currentContext.conversationHistory.push(`Agent: ${aiResponseText}`); // Add AI's response to history
            debugLog.push(`(System: AI response for '${currentNode.label}' saved to '{{${currentNode.outputVariable}}}'. Response: "${aiResponseText ? aiResponseText.substring(0, 70) + '...' : 'empty'}")`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
          } else {
            debugLog.push(`(System: AI step '${currentNode.label}' misconfigured - missing 'Instruction for AI' or 'Save AI Response As' variable)`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
          }
          break;
        
        case 'condition':
          const variableName = currentNode.conditionVariable;
          const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);
          const contextValue = variableName ? String(currentContext[variableName] || '').trim().toLowerCase() : '';
          
          debugLog.push(`(System: Decision step '${currentNode.label}' evaluating variable '{{${variableName}}}' (current value: '${contextValue}'). Use AI for decision: ${!!currentNode.useLLMForDecision})`);


          if (!variableName || currentContext[variableName] === undefined || currentContext[variableName] === null) {
            debugLog.push(`(System: Decision step '${currentNode.label}' - variable '{{${variableName || 'undefined'}}}' not found or not set in context. Attempting default path.)`);
            nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition.trim() === "");
          } else {
            if (currentNode.useLLMForDecision) {
              const edgeConditionLabels = outgoingEdges
                .map(edge => edge.condition?.trim()) 
                .filter((condition): condition is string => typeof condition === 'string' && condition !== ""); 
              
              if (edgeConditionLabels.length > 0) {
                debugLog.push(`(System: Using AI for decision for step '${currentNode.label}'. Input: "${contextValue}". Edge conditions/intents: ${JSON.stringify(edgeConditionLabels)})`);
                // Simple prompt for LLM to pick a category.
                const llmPromptForDecision = `The user's input related to a choice was: "${contextValue}". Which of the following categories best describes this input? Categories: ${JSON.stringify(edgeConditionLabels)}. Respond with *only* the text of the chosen category. If none clearly match, respond with an empty string or a category that implies 'other'.`;
                try {
                  const decisionResponse = await ai.generate({ prompt: llmPromptForDecision });
                  let chosenCategory = decisionResponse.text?.trim().toLowerCase();
                  debugLog.push(`(System: AI decision for '${currentNode.label}': '${chosenCategory}')`);
                  
                  nextEdge = outgoingEdges.find(edge => edge.condition?.trim().toLowerCase() === chosenCategory);
                  if (!nextEdge) { 
                     debugLog.push(`(System: AI decision '${chosenCategory}' for step '${currentNode.label}' did not match any edge condition. Trying default.)`);
                    nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition.trim() === "");
                  }
                } catch (llmError: any) {
                  debugLog.push(`(System: AI decision error for step '${currentNode.label}': ${llmError.message}. Trying default.)`);
                  nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition.trim() === "");
                }
              } else { // No edge conditions to give to LLM
                 debugLog.push(`(System: Decision step '${currentNode.label}' set to use AI, but no valid edge conditions found. Trying default.)`);
                nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition.trim() === "");
              }
            } else { // Exact match (non-LLM)
              nextEdge = outgoingEdges.find(edge => edge.condition?.trim().toLowerCase() === contextValue);
              if (nextEdge) {
                debugLog.push(`(System: Decision matched edge with condition '${nextEdge.condition}'. Next step: ${flowDefinition.nodes.find(n=>n.id===nextEdge?.target)?.label || nextEdge?.target})`);
              } else {
                debugLog.push(`(System: No exact condition match for '${contextValue}'. Trying default path.)`);
                nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition?.trim() === "");
                if (nextEdge) {
                    debugLog.push(`(System: Took default edge. Next step: ${flowDefinition.nodes.find(n=>n.id===nextEdge?.target)?.label || nextEdge?.target})`);
                }
              }
            }
          }
          if (!nextEdge && currentNode.type === 'condition') {
            const errorMessage = `Decision step '${currentNode.label}' - No matching path for value '${contextValue}' in '{{${variableName}}}' and no default path found! Flow cannot continue.`;
            debugLog.push(`(System: ERROR - ${errorMessage})`);
            error = errorMessage;
            isFlowFinished = true; // Mark as finished to stop processing
            currentNodeId = undefined; 
            continue;
          }
          break;
        
        case 'qnaLookup': 
            debugLog.push(`(System: Q&A Lookup step '${currentNode.label}')`);
            let found = false;
            const query = currentNode.qnaQueryVariable ? String(currentContext[currentNode.qnaQueryVariable] || '') : currentMessage;
            let qnaResponseMessage = "";

            if (query && knowledgeItems && knowledgeItems.length > 0) {
                const lowerQuery = query.toLowerCase();
                // Basic search for now - in a real app, this would use vector search/embeddings
                for (const item of knowledgeItems) {
                    if (item.summary?.toLowerCase().includes(lowerQuery) || item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))) {
                        found = true;
                        qnaResponseMessage = item.summary || "Found relevant information from knowledge base.";
                        if (currentNode.qnaOutputVariable) {
                            currentContext[currentNode.qnaOutputVariable] = qnaResponseMessage;
                        }
                        break;
                    }
                }
            }

            if (found) {
                debugLog.push(`(System: Q&A Lookup step '${currentNode.label}' found answer for query "${query.substring(0,50)}...". Sending: "${qnaResponseMessage.substring(0,70)}...")`);
                messagesToSend.push(qnaResponseMessage);
                currentContext.conversationHistory.push(`Agent: ${qnaResponseMessage}`);
                nextEdge = findNextEdge(currentNode.id, flowDefinition, 'found');
            } else {
                qnaResponseMessage = currentNode.qnaFallbackText || "I couldn't find an answer for that in my current knowledge.";
                debugLog.push(`(System: Q&A Lookup step '${currentNode.label}' did NOT find answer for query "${query.substring(0,50)}...". Sending fallback: "${qnaResponseMessage.substring(0,70)}...")`);
                if (currentNode.qnaOutputVariable) { // Save fallback to variable if specified
                     currentContext[currentNode.qnaOutputVariable] = qnaResponseMessage;
                }
                messagesToSend.push(qnaResponseMessage);
                currentContext.conversationHistory.push(`Agent: ${qnaResponseMessage}`);
                nextEdge = findNextEdge(currentNode.id, flowDefinition, 'notFound');
            }
            if (!nextEdge) nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default'); 
            break;

        case 'wait':
            const waitDuration = currentNode.waitDurationMs || 0;
            debugLog.push(`(System: Wait step '${currentNode.label}' starting for ${waitDuration}ms)`);
            if (waitDuration > 0) {
                await new Promise(resolve => setTimeout(resolve, waitDuration));
            }
            debugLog.push(`(System: Wait step '${currentNode.label}' finished)`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'end':
          let finalMessage = "";
          if (currentNode.endOutputVariable && currentContext[currentNode.endOutputVariable] !== undefined) {
            finalMessage = templatize(String(currentContext[currentNode.endOutputVariable]), currentContext);
            messagesToSend.push(finalMessage);
            currentContext.conversationHistory.push(`Agent: ${finalMessage}`);
            debugLog.push(`(System: Flow ended at step '${currentNode.label}'. Final output from '{{${currentNode.endOutputVariable}}}': ${finalMessage.substring(0,70)}...)`);
          } else if (currentNode.endOutputVariable) {
            debugLog.push(`(System: Flow ended at step '${currentNode.label}'. Output variable '{{${currentNode.endOutputVariable}}}' was specified but not found in context.)`);
          } else {
            debugLog.push(`(System: Flow ended at step '${currentNode.label}'.)`);
          }
          isFlowFinished = true;
          currentNodeId = undefined; 
          continue; 

        default:
          const unknownNodeType = (currentNode as any).type;
          debugLog.push(`(System: Unknown or unsupported node type '${unknownNodeType}' encountered for node '${currentNode.id}'. This may indicate a flow definition error or an outdated flow executor.)`);
          nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default') || findNextEdge(currentNode.id, flowDefinition); 
          if (!nextEdge) {
             error = `Unsupported node type '${unknownNodeType}' and no default path. Flow stuck.`;
             debugLog.push(`(System: ${error})`);
          }
      }
      
      if (nextEdge) {
        const targetNodeInfo = flowDefinition.nodes.find(n=>n.id===nextEdge.target);
        debugLog.push(`(System: Next step is '${targetNodeInfo?.label || nextEdge.target}' via connection '${nextEdge.label || nextEdge.edgeType || nextEdge.id}')`);
        currentNodeId = nextEdge.target;
      } else {
        if (currentNode.type !== 'end' && !isFlowFinished && !currentContext.waitingForInput) { 
           // Only log as stuck if it's not an end node, not already finished, and not waiting for input.
           debugLog.push(`(System: No outgoing connection from step '${currentNode.label || currentNode.id}' and it's not an end step or waiting for input. Flow may be stuck.)`);
           isFlowFinished = true; 
        }
        currentNodeId = undefined; 
      }
    } 

    if (maxSteps <= 0) {
      error = "Flow execution exceeded maximum steps.";
      debugLog.push(`(System: ${error})`);
      isFlowFinished = true; // If max steps exceeded, consider it finished to prevent further processing
    }

  } catch (e: any) {
    console.error("Error executing agent flow:", e);
    error = e.message || "An unexpected error occurred during flow execution.";
    debugLog.push(`(System: Flow execution error - ${error})`);
    isFlowFinished = true; // Error means flow is effectively finished
  }
  
  // If flow ended or an error occurred, ensure no pending input state
  if (isFlowFinished || error) {
    currentContext.waitingForInput = undefined;
    currentContext.currentNodeId = undefined; // Clear current node if flow is done or errored
  }

  return { 
    messagesToSend, 
    debugLog,
    updatedContext: currentContext, 
    error, 
    nextNodeId: currentContext.waitingForInput, // This should be set if a getUserInput is waiting
    isFlowFinished 
  };
}

// This is the Genkit flow definition that wraps the main execution logic.
// It's kept for potential future use if Genkit's flow management features are needed.
// Currently, the exported executeAgentFlow function is called directly by the API route.
const agentJsonFlow = ai.defineFlow(
  {
    name: 'agentJsonFlow', 
    inputSchema: ExecuteAgentFlowInputSchema,
    outputSchema: ExecuteAgentFlowOutputSchema,
  },
  async (input) => {
    return executeAgentFlow(input); // Call the main logic function
  }
);

