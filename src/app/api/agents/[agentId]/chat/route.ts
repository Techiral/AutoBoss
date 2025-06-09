
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

// --- Zod Schemas for Request and Response ---
const FlowStateSchema = z.object({
  context: z.record(z.any()).describe("The complete FlowContext object from the previous turn."),
  nextNodeId: z.string().describe("The ID of the node the flow is currently waiting on."),
});

const RequestBodySchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty." }),
  flowState: FlowStateSchema.optional().describe("If provided, attempts to resume or continue an existing flow."),
  conversationHistoryString: z.string().optional().describe("A simple string of past dialogue. Used for autonomousReasoning if a flow is not being executed."),
});
type ApiRequestBody = z.infer<typeof RequestBodySchema>;


// Helper to create standardized error responses
const createErrorResponse = (status: number, message: string, details?: Record<string, any>) => {
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

  const { message: userInput, flowState, conversationHistoryString } = requestBody;

  try {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return createErrorResponse(404, `Agent with ID '${agentId}' not found.`);
    }
    
    const agent = convertAgentForFlow({ id: agentSnap.id, ...agentSnap.data() });
    const knowledgeItems = agent.knowledgeItems || [];
    const primaryLogic: AgentLogicType = agent.primaryLogic || 'hybrid'; // Default to hybrid if not set

    let inputContext: FlowContext;
    if (flowState?.context) {
        inputContext = flowState.context;
        if (!inputContext.conversationHistory) inputContext.conversationHistory = [];
        inputContext.conversationHistory.push(`User: ${userInput}`);
    } else {
        inputContext = { conversationHistory: [] }; 
        if (agent.generatedGreeting) {
             inputContext.conversationHistory.push(`Agent: ${agent.generatedGreeting}`);
        }
        inputContext.conversationHistory.push(`User: ${userInput}`);
    }
    
    // --- Prompt-based or RAG-based Logic Path ---
    if (primaryLogic === 'prompt' || primaryLogic === 'rag') {
      const reasoningInput: AutonomousReasoningInput = {
        agentName: agent.generatedName,
        agentPersona: agent.generatedPersona,
        agentRole: agent.role,
        context: inputContext.conversationHistory.join('\n'),
        userInput: userInput,
        knowledgeItems: primaryLogic === 'rag' ? knowledgeItems : (knowledgeItems.length > 0 ? knowledgeItems : undefined), // For 'prompt', knowledge is optional
      };
      const result = await autonomousReasoning(reasoningInput);
      inputContext.conversationHistory.push(`Agent: ${result.responseToUser}`);
      return NextResponse.json({ 
        type: primaryLogic, // 'prompt' or 'rag'
        reply: result.responseToUser,
        reasoning: result.reasoning,
        relevantKnowledgeIds: result.relevantKnowledgeIds,
        newFlowState: { context: inputContext, nextNodeId: undefined } 
      }, { status: 200 });
    }

    // --- Flow-based or Hybrid Logic Path ---
    let flowResult: Awaited<ReturnType<typeof executeAgentFlow>> | null = null;
    let attemptFlowExecution = primaryLogic === 'flow' || primaryLogic === 'hybrid';

    if (attemptFlowExecution && agent.flow && agent.flow.nodes.find(n => n.type === 'start')) {
      let nodeToExecute = flowState?.nextNodeId || agent.flow.nodes.find(n => n.type === 'start')?.id;

      if (nodeToExecute) {
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: agent.flow,
          currentContext: inputContext,
          currentMessage: userInput,
          startNodeId: nodeToExecute,
          knowledgeItems: knowledgeItems,
          agent: agent,
        };
        
        flowResult = await executeAgentFlow(flowInput);
        
        const agentMessagesForHistory = flowResult.messagesToSend.filter(m => !m.startsWith("(System:")).map(m => `Agent: ${m}`);
        inputContext = { 
            ...flowResult.updatedContext,
            conversationHistory: [...(inputContext.conversationHistory || []), ...agentMessagesForHistory]
        };

        if (flowResult.error) {
           return NextResponse.json({
             type: 'flow',
             messages: flowResult.messagesToSend,
             debugLog: flowResult.debugLog,
             newFlowState: flowResult.nextNodeId ? { context: inputContext, nextNodeId: flowResult.nextNodeId } : {context: inputContext, nextNodeId: undefined},
             isFlowFinished: flowResult.isFlowFinished,
             error: flowResult.error 
           }, { status: 200 });
        }

        // If primary logic is 'flow', return flow result directly.
        if (primaryLogic === 'flow') {
          return NextResponse.json({ 
            type: 'flow',
            messages: flowResult.messagesToSend,
            debugLog: flowResult.debugLog,
            newFlowState: flowResult.nextNodeId ? { context: inputContext, nextNodeId: flowResult.nextNodeId } : {context: inputContext, nextNodeId: undefined},
            isFlowFinished: flowResult.isFlowFinished,
          }, { status: 200 });
        }
      }
    }
    
    // --- Fallback to Autonomous Reasoning for Hybrid if flow finished, or if no flow was applicable for hybrid ---
    if (primaryLogic === 'hybrid' && (!flowResult || (flowResult.isFlowFinished && !flowResult.nextNodeId)) ) {
        const reasoningInput: AutonomousReasoningInput = {
            agentName: agent.generatedName,
            agentPersona: agent.generatedPersona,
            agentRole: agent.role,
            context: inputContext.conversationHistory.join('\n'),
            userInput: userInput,
            knowledgeItems: knowledgeItems, // Hybrid fallback can use knowledge
        };
        const result = await autonomousReasoning(reasoningInput);
        inputContext.conversationHistory.push(`Agent: ${result.responseToUser}`);
        return NextResponse.json({ 
            type: 'autonomous', // Labeling hybrid fallback as 'autonomous' type
            reply: result.responseToUser,
            reasoning: result.reasoning,
            relevantKnowledgeIds: result.relevantKnowledgeIds,
            newFlowState: { context: inputContext, nextNodeId: undefined }
        }, { status: 200 });
    } else if (primaryLogic === 'hybrid' && flowResult && flowResult.nextNodeId) {
        // Hybrid, but flow is still active
         return NextResponse.json({ 
            type: 'flow',
            messages: flowResult.messagesToSend,
            debugLog: flowResult.debugLog,
            newFlowState: { context: inputContext, nextNodeId: flowResult.nextNodeId },
            isFlowFinished: flowResult.isFlowFinished,
          }, { status: 200 });
    }
    
    // If primaryLogic is 'flow' but flow execution didn't yield a response and it's not waiting
    if (primaryLogic === 'flow' && flowResult && (!flowResult.messagesToSend || flowResult.messagesToSend.length === 0) && !flowResult.nextNodeId) {
        return createErrorResponse(500, "Flow logic executed but produced no response or next step.");
    }

    // Default fallback if no logic path was definitively taken
    console.warn(`Agent ${agentId} with primaryLogic '${primaryLogic}' did not match any processing path. Defaulting to basic autonomous reasoning.`);
    const defaultReasoningInput: AutonomousReasoningInput = {
        agentName: agent.generatedName,
        agentPersona: agent.generatedPersona,
        agentRole: agent.role,
        context: inputContext.conversationHistory.join('\n'),
        userInput: userInput,
        knowledgeItems: knowledgeItems,
    };
    const defaultResult = await autonomousReasoning(defaultReasoningInput);
    inputContext.conversationHistory.push(`Agent: ${defaultResult.responseToUser}`);
    return NextResponse.json({ 
        type: 'autonomous', 
        reply: defaultResult.responseToUser,
        reasoning: defaultResult.reasoning,
        relevantKnowledgeIds: defaultResult.relevantKnowledgeIds,
        newFlowState: { context: inputContext, nextNodeId: undefined }
    }, { status: 200 });


  } catch (error: any) {
    console.error(`API Error for agent ${agentId} | Message: ${userInput.substring(0,50)} | Error:`, error);
    if (error.message.includes("Agent not found")) { 
        return createErrorResponse(404, error.message);
    }
    return createErrorResponse(500, 'An unexpected error occurred while processing your request.', { internalError: error.message });
  }
}
