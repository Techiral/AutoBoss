
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import { executeAgentFlow, ExecuteAgentFlowInput } from '@/ai/flows/execute-agent-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent, KnowledgeItem, FlowContext, AgentFlowDefinition, AgentLogicType } from '@/lib/types';

// Helper to convert Firestore Timestamps in agent data
const convertAgentForFlow = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.knowledgeItems) {
    newAgent.knowledgeItems = newAgent.knowledgeItems.map((item: any) => {
      if (item.uploadedAt && item.uploadedAt.toDate) {
        return { ...item, uploadedAt: item.uploadedAt.toDate().toISOString() };
      }
      return item;
    });
  }
  if (agentData.flow) {
    newAgent.flow = agentData.flow;
  }
  return newAgent as Agent;
};

// Zod Schemas for Request and Response
const FlowContextSchemaForApi = z.record(z.any()).optional().describe("The FlowContext object from the previous turn. Includes conversationHistory.");

const FlowStateSchema = z.object({
  context: FlowContextSchemaForApi,
  nextNodeId: z.string().optional().describe("The ID of the node the flow is currently waiting on, if any."),
});

const RequestBodySchema = z.object({
  message: z.string().optional().describe("User's input message. Optional for initialization calls."), // Optional for init
  flowState: FlowStateSchema.optional().describe("If provided, attempts to resume or continue an existing flow."),
  // conversationHistoryString: z.string().optional().describe("A simple string of past dialogue. Used for autonomousReasoning if a flow is not being executed."), // Deprecated in favor of flowState.context.conversationHistory
});
type ApiRequestBody = z.infer<typeof RequestBodySchema>;


const createErrorResponse = (status: number, message: string, details?: Record<string, any>) => {
  console.error(`API Error Response (${status}): ${message}`, details || '');
  return NextResponse.json(
    {
      error: {
        code: status,
        message: message,
        details: details,
      },
    },
    { status }
  );
};

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;

  if (!agentId) {
    return createErrorResponse(400, "Agent ID is missing in the path.");
  }

  let requestBody: ApiRequestBody;
  try {
    const rawBody = await request.json();
    requestBody = RequestBodySchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, "Invalid request body.", { issues: error.errors });
    }
    return createErrorResponse(400, "Malformed JSON in request body.");
  }

  const { message: userInput, flowState } = requestBody;
  console.log(`API Route: Received request for agent ${agentId}. UserInput: "${userInput ? userInput.substring(0,50) + '...' : 'N/A'}", FlowState provided: ${!!flowState}`);


  try {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return createErrorResponse(404, `Agent with ID '${agentId}' not found.`);
    }
    
    const agent = convertAgentForFlow({ id: agentSnap.id, ...agentSnap.data() });
    const knowledgeItems = agent.knowledgeItems || [];
    const primaryLogic: AgentLogicType = agent.primaryLogic || 'hybrid'; 

    let turnContext: FlowContext = flowState?.context || { conversationHistory: [] };
    // Ensure conversationHistory is always an array. If userInput is present, it means this is an active turn from the user.
    // The client-side ChatInterface is now responsible for adding the user's message to history before sending.
    // The server will add the agent's messages to history.
    if (!Array.isArray(turnContext.conversationHistory)) {
        turnContext.conversationHistory = [];
    }
    
    console.log(`API Route: Agent primaryLogic: ${primaryLogic}. Initial turnContext.conversationHistory length: ${turnContext.conversationHistory.length}`);


    // --- Logic Path Selection ---
    if (primaryLogic === 'prompt' || primaryLogic === 'rag') {
      if (!userInput) return createErrorResponse(400, "User input is required for prompt/RAG based agents.");
      console.log(`API Route: Executing ${primaryLogic} logic for agent ${agentId}`);
      const reasoningInput: AutonomousReasoningInput = {
        agentName: agent.generatedName,
        agentPersona: agent.generatedPersona,
        agentRole: agent.role,
        context: turnContext.conversationHistory.join('\n'), // Pass full history
        userInput: userInput,
        knowledgeItems: knowledgeItems, 
      };
      const result = await autonomousReasoning(reasoningInput);
      turnContext.conversationHistory.push(`Agent: ${result.responseToUser}`);
      return NextResponse.json({ 
        type: primaryLogic,
        reply: result.responseToUser,
        reasoning: result.reasoning,
        relevantKnowledgeIds: result.relevantKnowledgeIds,
        newFlowState: { context: turnContext, nextNodeId: undefined } 
      }, { status: 200 });
    }

    // --- Flow-based or Hybrid Logic Path ---
    let flowResult: Awaited<ReturnType<typeof executeAgentFlow>> | null = null;
    let attemptFlowExecution = (primaryLogic === 'flow' || primaryLogic === 'hybrid');

    if (attemptFlowExecution && agent.flow && agent.flow.nodes.find(n => n.type === 'start')) {
      let nodeToExecute = flowState?.nextNodeId || agent.flow.nodes.find(n => n.type === 'start')?.id;
      console.log(`API Route: Attempting flow execution for agent ${agentId}. StartNodeID: ${nodeToExecute}`);

      if (nodeToExecute) {
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: agent.flow,
          currentContext: { ...turnContext }, // Pass a copy to avoid direct mutation issues if any
          currentMessage: userInput, // Can be undefined for init calls
          startNodeId: nodeToExecute,
          knowledgeItems: knowledgeItems,
          agent: agent,
        };
        
        flowResult = await executeAgentFlow(flowInput);
        console.log(`API Route: Flow execution result for agent ${agentId}. Error: ${flowResult.error}, Finished: ${flowResult.isFlowFinished}, NextNode: ${flowResult.nextNodeId}, Messages: ${flowResult.messagesToSend.length}`);
        
        // IMPORTANT: executeAgentFlow is expected to update its internal copy of context's conversationHistory
        // with the agent's messages. So, flowResult.updatedContext.conversationHistory should be the most current.
        turnContext = flowResult.updatedContext; 

        if (flowResult.error) {
           // Still return 200, but include error in payload for client to handle
           return NextResponse.json({
             type: 'flow',
             messages: flowResult.messagesToSend, // Send any messages generated before error
             debugLog: flowResult.debugLog,
             newFlowState: { context: turnContext, nextNodeId: flowResult.nextNodeId },
             isFlowFinished: flowResult.isFlowFinished,
             error: flowResult.error 
           }, { status: 200 });
        }

        if (primaryLogic === 'flow') {
          return NextResponse.json({ 
            type: 'flow',
            messages: flowResult.messagesToSend,
            debugLog: flowResult.debugLog,
            newFlowState: { context: turnContext, nextNodeId: flowResult.nextNodeId },
            isFlowFinished: flowResult.isFlowFinished,
          }, { status: 200 });
        }
      } else {
         console.log(`API Route: No startNodeId found for flow execution for agent ${agentId}. Skipping flow.`);
         attemptFlowExecution = false; // Cannot execute flow if no start node
      }
    }
    
    // Fallback to Autonomous Reasoning for Hybrid if flow finished, or if flow wasn't applicable
    if (primaryLogic === 'hybrid' && (!flowResult || (flowResult.isFlowFinished && !flowResult.nextNodeId)) ) {
        if (!userInput) { // This can happen if an initial hybrid flow ends without prompting for input
            console.log(`API Route: Hybrid agent ${agentId} flow ended without user input needed. Sending flow messages if any.`);
            // If the flow had messages and ended, send them. If not, it's an empty state.
             return NextResponse.json({ 
                type: 'flow', // Still technically a flow result, just an ended one
                messages: flowResult?.messagesToSend || [],
                debugLog: flowResult?.debugLog || [],
                newFlowState: { context: turnContext, nextNodeId: undefined }, // No next node
                isFlowFinished: true,
             }, { status: 200 });
        }
        console.log(`API Route: Hybrid agent ${agentId} - flow finished or not run. Falling back to autonomous reasoning.`);
        const reasoningInput: AutonomousReasoningInput = {
            agentName: agent.generatedName,
            agentPersona: agent.generatedPersona,
            agentRole: agent.role,
            context: turnContext.conversationHistory.join('\n'), // Use history from flow if it ran
            userInput: userInput,
            knowledgeItems: knowledgeItems,
        };
        const result = await autonomousReasoning(reasoningInput);
        turnContext.conversationHistory.push(`Agent: ${result.responseToUser}`);
        return NextResponse.json({ 
            type: 'autonomous', 
            reply: result.responseToUser,
            reasoning: result.reasoning,
            relevantKnowledgeIds: result.relevantKnowledgeIds,
            newFlowState: { context: turnContext, nextNodeId: undefined }
        }, { status: 200 });
    } else if (primaryLogic === 'hybrid' && flowResult && flowResult.nextNodeId) {
        // Hybrid, but flow is still active and waiting for next input
         console.log(`API Route: Hybrid agent ${agentId} - flow active, waiting for next input at ${flowResult.nextNodeId}.`);
         return NextResponse.json({ 
            type: 'flow',
            messages: flowResult.messagesToSend,
            debugLog: flowResult.debugLog,
            newFlowState: { context: turnContext, nextNodeId: flowResult.nextNodeId },
            isFlowFinished: flowResult.isFlowFinished,
          }, { status: 200 });
    }
    
    // Default fallback if no other logic path was definitively taken (e.g. old agent with no primaryLogic)
    console.warn(`API Route: Agent ${agentId} with primaryLogic '${primaryLogic}' did not match a conclusive processing path. Defaulting to basic autonomous reasoning.`);
    if (!userInput) return createErrorResponse(400, "User input is required for default autonomous reasoning.");
    
    const defaultReasoningInput: AutonomousReasoningInput = {
        agentName: agent.generatedName,
        agentPersona: agent.generatedPersona,
        agentRole: agent.role,
        context: turnContext.conversationHistory.join('\n'),
        userInput: userInput,
        knowledgeItems: knowledgeItems,
    };
    const defaultResult = await autonomousReasoning(defaultReasoningInput);
    turnContext.conversationHistory.push(`Agent: ${defaultResult.responseToUser}`);
    return NextResponse.json({ 
        type: 'autonomous', 
        reply: defaultResult.responseToUser,
        reasoning: defaultResult.reasoning,
        relevantKnowledgeIds: defaultResult.relevantKnowledgeIds,
        newFlowState: { context: turnContext, nextNodeId: undefined }
    }, { status: 200 });


  } catch (error: any) {
    console.error(`API Route: Unhandled error for agent ${agentId} | UserInput: "${userInput ? userInput.substring(0,50) + '...' : 'N/A'}" | Error:`, error.message, error.stack);
    if (error.message.includes("Agent not found")) { 
        return createErrorResponse(404, error.message);
    }
    return createErrorResponse(500, 'An unexpected error occurred while processing your request.', { internalError: error.message });
  }
}
