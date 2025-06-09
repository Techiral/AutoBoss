
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
import type { FlowNode, FlowEdge, AgentFlowDefinition, FlowContext, KnowledgeItem, Agent } from '@/lib/types'; // Import types
import { AgentFlowDefinitionSchema, FlowContextSchema, KnowledgeItemSchema } from '@/lib/types'; // Import Zod schemas

// Input schema for the Genkit flow, using imported Zod schemas
const ExecuteAgentFlowInputSchema = z.object({
  flowDefinition: AgentFlowDefinitionSchema.describe("The JSON definition of the agent's conversational flow."),
  currentContext: FlowContextSchema.describe("The current state of conversation variables."),
  currentMessage: z.string().optional().describe("The user's latest input message, if any."),
  startNodeId: z.string().optional().describe("The ID of the node from which to start or resume execution. Defaults to 'start' node."),
  knowledgeItems: z.array(KnowledgeItemSchema).optional().describe("An array of knowledge items for the agent."),
  agent: z.custom<Agent>().optional().describe("The full agent object, for persona/role context."),
});
export type ExecuteAgentFlowInput = z.infer<typeof ExecuteAgentFlowInputSchema>;

// Output schema for the Genkit flow, using imported Zod schemas
const ExecuteAgentFlowOutputSchema = z.object({
  messagesToSend: z.array(z.string()).describe("An array of messages the agent should send to the user."),
  debugLog: z.array(z.string()).optional().describe("Internal system messages for debugging flow execution."),
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
    return outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "") || outgoingEdges[0];
}


export async function executeAgentFlow(input: ExecuteAgentFlowInput): Promise<ExecuteAgentFlowOutput> {
  const { flowDefinition, currentMessage, knowledgeItems, agent } = input;
  let { currentContext, startNodeId } = input;

  const messagesToSend: string[] = [];
  const debugLog: string[] = [];
  let error: string | undefined = undefined;
  let isFlowFinished = false;

  const agentPersonaSystemMessage = agent?.generatedPersona ? `You are ${agent.generatedName || agent.name}. Your persona: ${agent.generatedPersona}. Your role: ${agent.role || 'an AI assistant'}.` : '';

  try {
    let currentNodeId = startNodeId || flowDefinition.nodes.find(n => n.type === 'start')?.id;
    if (!currentNodeId) {
      return { messagesToSend, debugLog, updatedContext: currentContext, error: "No start node found or specified.", isFlowFinished: true };
    }
    debugLog.push(`(System: Starting flow from node '${currentNodeId}')`);

    let maxSteps = 20; // Safety break for loops

    while (currentNodeId && maxSteps > 0) {
      maxSteps--;
      const currentNode = flowDefinition.nodes.find(n => n.id === currentNodeId);

      if (!currentNode) {
        error = `Node with ID ${currentNodeId} not found.`;
        debugLog.push(`(System: Error - ${error})`);
        break;
      }
      
      currentContext.currentNodeId = currentNode.id; // Store current node in context
      debugLog.push(`(System: Executing node '${currentNode.label || currentNode.id}' of type '${currentNode.type}')`);
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
            debugLog.push(`(System: Received input "${currentMessage}" for node '${currentNode.id}')`);
            if (currentNode.variableName) {
              currentContext[currentNode.variableName] = currentMessage;
              debugLog.push(`(System: Set context.${currentNode.variableName} = "${currentMessage}")`);
            }
            currentContext.waitingForInput = undefined; 
            const isValid = true; 
            if (isValid) {
                 nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default');
            } else {
                 nextEdge = findNextEdge(currentNode.id, flowDefinition, 'invalid');
                 if (!nextEdge) debugLog.push(`(System: Input for ${currentNode.id} was invalid, but no 'invalid' path defined.)`);
            }
          } else if (!currentContext.waitingForInput) {
            if (currentNode.prompt) {
              messagesToSend.push(templatize(currentNode.prompt, currentContext));
            }
            currentContext.waitingForInput = currentNode.id; 
            debugLog.push(`(System: Now waiting for input at node '${currentNode.id}')`);
            return { messagesToSend, debugLog, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished };
          } else {
            debugLog.push(`(System: Stuck at getUserInput '${currentNode.id}', still waiting for message. This call had no currentMessage.)`);
            return { messagesToSend, debugLog, updatedContext: currentContext, nextNodeId: currentNode.id, isFlowFinished };
          }
          break;

        case 'callLLM':
          if (currentNode.llmPrompt && currentNode.outputVariable) {
            let populatedNodePrompt = templatize(currentNode.llmPrompt, currentContext);
            let knowledgePreamble = "";
            
            if (currentNode.useKnowledge && knowledgeItems && knowledgeItems.length > 0) {
              const knowledgeSummaries = knowledgeItems
                .map(item => `ID: ${item.id}\nSource: ${item.fileName}\nSummary: ${item.summary}\nKeywords: ${item.keywords?.join(', ') || 'N/A'}`)
                .filter(Boolean) 
                .join("\n\n---\n\n");
              
              if (knowledgeSummaries) {
                knowledgePreamble = `
You have access to the following information from a knowledge base.
Your primary task is to respond to the "Original Prompt" below.
Before responding, review the "Available Knowledge Items" and determine if any are relevant to the Original Prompt.
If relevant items are found, use them to inform your response. If you use knowledge, cite the source document name.

--- AVAILABLE KNOWLEDGE ITEMS START ---
${knowledgeSummaries}
--- AVAILABLE KNOWLEDGE ITEMS END ---`;
              }
            }
            
            const fullPromptForLLM = `${agentPersonaSystemMessage ? agentPersonaSystemMessage + '\n\n' : ''}${knowledgePreamble}\n\nOriginal Prompt for this step:\n${populatedNodePrompt}\n\nBased on the Original Prompt, your persona, and any relevant knowledge, generate the response for this step.`;
            debugLog.push(`(System: Calling LLM for node '${currentNode.id}' with prompt (condensed): ${fullPromptForLLM.substring(0, 100)}...)`);

            const llmResponse = await ai.generate({ prompt: fullPromptForLLM });
            currentContext[currentNode.outputVariable] = llmResponse.text;
            // The LLM response itself is a "messageToSend" if it's meant to be directly relayed.
            // For now, assume the primary output of a callLLM node is to store in context.
            // If this node should also *send* the LLM response, it should be followed by a sendMessage node.
            // However, to simplify, let's assume if an output variable is set, it *might* be used as a message by a subsequent step
            // OR a common pattern is for the callLLM to directly provide the next message.
            // For now, we will NOT automatically add llmResponse.text to messagesToSend here.
            // The flow designer should use a subsequent 'sendMessage' node with {{aiResponseVariable}} if they want to send it.
            debugLog.push(`(System: LLM Call Node '${currentNode.id}' output: "${llmResponse.text ? llmResponse.text.substring(0, 70) + '...' : 'empty'}")`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
          } else {
            debugLog.push(`(System: LLM node '${currentNode.id}' misconfigured - missing prompt or outputVariable)`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
          }
          break;
        
        case 'condition':
          const variableName = currentNode.conditionVariable;
          const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);

          if (!variableName || currentContext[variableName] === undefined || currentContext[variableName] === null) {
            debugLog.push(`(System: Condition node '${currentNode.id}' - variable '${variableName || 'undefined'}' not found or not set in context. Value: ${currentContext[variableName]}. Attempting default path.)`);
            nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
          } else {
            const valueToEvaluate = String(currentContext[variableName]).trim().toLowerCase();
            debugLog.push(`(System: Condition node '${currentNode.id}' evaluating variable '${variableName}', value: '${valueToEvaluate}')`);

            if (currentNode.useLLMForDecision) {
              const edgeConditionLabels = outgoingEdges
                .map(edge => edge.condition?.trim()) 
                .filter((condition): condition is string => typeof condition === 'string' && condition !== ""); 
              
              if (edgeConditionLabels.length > 0) {
                debugLog.push(`(System: Using LLM for decision. Edge conditions/intents: ${JSON.stringify(edgeConditionLabels)})`);
                const llmPromptForDecision = `${agentPersonaSystemMessage ? agentPersonaSystemMessage + '\n\n' : ''}Value to evaluate: "${valueToEvaluate}". Based on this value, which of the following categories or intents best describes it? Categories: ${JSON.stringify(edgeConditionLabels)}. Respond with *only* the text of the chosen category. If none directly match, and there's an edge with an empty condition label (acting as a default), respond with that empty label's implied category.`;
                try {
                  const decisionResponse = await ai.generate({ prompt: llmPromptForDecision });
                  let chosenCategory = decisionResponse.text?.trim().toLowerCase();
                  debugLog.push(`(System: LLM decision for '${currentNode.id}': '${chosenCategory}')`);
                  
                  nextEdge = outgoingEdges.find(edge => edge.condition?.trim().toLowerCase() === chosenCategory);
                  if (!nextEdge) { 
                     debugLog.push(`(System: LLM decision '${chosenCategory}' for node '${currentNode.id}' did not match any edge condition. Trying default.)`);
                    nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
                  }
                } catch (llmError: any) {
                  debugLog.push(`(System: LLM decision error for node '${currentNode.id}': ${llmError.message}. Trying default.)`);
                  nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
                }
              } else {
                 debugLog.push(`(System: Condition node '${currentNode.id}' set to useLLMForDecision, but no valid edge conditions found. Trying default.)`);
                nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition === "");
              }
            } else { // Exact match (non-LLM)
              nextEdge = outgoingEdges.find(edge => edge.condition?.trim().toLowerCase() === valueToEvaluate);
              if (nextEdge) {
                debugLog.push(`(System: Condition matched edge with condition '${nextEdge.condition}'. Next node: ${nextEdge.target})`);
              } else {
                debugLog.push(`(System: No exact condition match for '${valueToEvaluate}'. Trying default path.)`);
                nextEdge = outgoingEdges.find(edge => edge.edgeType === 'default' || !edge.condition || edge.condition?.trim() === "");
                if (nextEdge) {
                    debugLog.push(`(System: Took default edge. Next node: ${nextEdge.target})`);
                }
              }
            }
          }
          if (!nextEdge && currentNode.type === 'condition') {
            debugLog.push(`(System: Condition node '${currentNode.id}' did not find a matching edge or default path. Flow cannot continue from this node.)`);
            currentNodeId = undefined; // Stop flow
            continue;
          }
          break;

        case 'apiCall': 
           debugLog.push(`(System: HTTP Request (apiCall) node '${currentNode.id}' - Placeholder. Would call ${currentNode.apiMethod || 'GET'} ${templatize(currentNode.apiUrl || '', currentContext)})`);
           currentContext[currentNode.apiOutputVariable || 'apiResult'] = "Placeholder API Response";
           nextEdge = findNextEdge(currentNode.id, flowDefinition, 'success');
           if (!nextEdge) nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default');
          break;
        
        case 'action': 
          debugLog.push(`(System: Action node '${currentNode.id}' - Placeholder. Action: ${currentNode.actionName || 'N/A'})`);
          nextEdge = findNextEdge(currentNode.id, flowDefinition);
          break;

        case 'code': 
            debugLog.push(`(System: Code (JS) node '${currentNode.id}' - Placeholder. Script: '${currentNode.codeScript?.substring(0, 50)}...')`);
            if (currentNode.codeScript && currentNode.codeReturnVarMap) {
                const match = currentNode.codeScript.match(/return\s*{\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']\s*};?/);
                if (match) {
                    const returnKey = match[1];
                    const returnValue = match[2];
                    for (const [contextVar, scriptVar] of Object.entries(currentNode.codeReturnVarMap)) {
                        if (scriptVar === returnKey) {
                            currentContext[contextVar] = returnValue;
                            debugLog.push(`(System: Code node simulated setting context.${contextVar} to "${returnValue}")`);
                        }
                    }
                }
            }
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'qnaLookup': 
            debugLog.push(`(System: Q&A Lookup node '${currentNode.id}' - Placeholder)`);
            let found = false;
            const query = currentNode.qnaQueryVariable ? String(currentContext[currentNode.qnaQueryVariable] || '') : currentMessage;

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
            if (!nextEdge) nextEdge = findNextEdge(currentNode.id, flowDefinition, 'default'); 
            break;

        case 'wait':
            debugLog.push(`(System: Wait node '${currentNode.id}' starting for ${currentNode.waitDurationMs || 0}ms)`);
            if (currentNode.waitDurationMs && currentNode.waitDurationMs > 0) {
                await new Promise(resolve => setTimeout(resolve, currentNode.waitDurationMs));
            }
            debugLog.push(`(System: Wait node '${currentNode.id}' finished)`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'transition': 
            debugLog.push(`(System: Transition node '${currentNode.id}' - Placeholder. Would transition to flow '${currentNode.transitionTargetFlowId}')`);
            isFlowFinished = true; 
            currentNodeId = undefined;
            continue;

        case 'agentSkill': 
            debugLog.push(`(System: Agent Skill node '${currentNode.id}' - Placeholder. Skill: ${currentNode.agentSkillId || 'N/A'})`);
            nextEdge = findNextEdge(currentNode.id, flowDefinition);
            break;

        case 'end':
          if (currentNode.endOutputVariable && currentContext[currentNode.endOutputVariable] !== undefined) {
            debugLog.push(`(System: Flow ended. Output from '${currentNode.endOutputVariable}': ${currentContext[currentNode.endOutputVariable]})`);
          } else if (currentNode.endOutputVariable) {
            debugLog.push(`(System: Flow ended. Output variable '${currentNode.endOutputVariable}' was specified but not found in context.)`);
          } else {
            debugLog.push("(System: Flow ended.)");
          }
          isFlowFinished = true;
          currentNodeId = undefined; 
          continue; 

        default:
          debugLog.push(`(System: Unknown node type '${(currentNode as any).type}' encountered for node '${currentNode.id}')`);
          nextEdge = findNextEdge(currentNode.id, flowDefinition); 
      }
      
      if (nextEdge) {
        debugLog.push(`(System: Next node is '${flowDefinition.nodes.find(n=>n.id===nextEdge.target)?.label || nextEdge.target}' via edge '${nextEdge.label || nextEdge.id}')`);
        currentNodeId = nextEdge.target;
      } else {
        if (currentNode.type !== 'end' && !isFlowFinished) { 
           debugLog.push(`(System: No outgoing edge from node '${currentNode.id}' and it's not an end node. Flow may be stuck.)`);
        }
        currentNodeId = undefined; 
      }
    } 

    if (maxSteps <= 0) {
      error = "Flow execution exceeded maximum steps.";
      debugLog.push(`(System: ${error})`);
    }

  } catch (e: any) {
    console.error("Error executing agent flow:", e);
    error = e.message || "An unexpected error occurred during flow execution.";
    debugLog.push(`(System: Flow execution error - ${error})`);
  }
  
  if (isFlowFinished || error) {
    currentContext.waitingForInput = undefined;
    currentContext.currentNodeId = undefined;
  }

  return { 
    messagesToSend, 
    debugLog,
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
    
