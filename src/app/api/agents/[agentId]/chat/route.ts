
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import { executeAgentFlow, ExecuteAgentFlowInput } from '@/ai/flows/execute-agent-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent, KnowledgeItem, FlowContext, AgentFlowDefinition } from '@/lib/types';

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

    // --- Try Flow Execution First if applicable ---
    if (agent.flow && agent.flow.nodes.find(n => n.type === 'start')) { // Ensure flow has a start node
      let inputContext: FlowContext;
      let nodeToExecute: string | undefined;

      if (flowState?.context && flowState?.nextNodeId) {
        // Resume existing flow
        inputContext = flowState.context;
        if (!inputContext.conversationHistory) inputContext.conversationHistory = [];
        inputContext.conversationHistory.push(`User: ${userInput}`);
        nodeToExecute = flowState.nextNodeId;
      } else {
        // Start new flow
        inputContext = { conversationHistory: [`Agent: ${agent.generatedGreeting || 'Hello!'}`, `User: ${userInput}`] }; 
        nodeToExecute = agent.flow.nodes.find(n => n.type === 'start')?.id;
      }

      if (nodeToExecute) {
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: agent.flow,
          currentContext: inputContext,
          currentMessage: userInput,
          startNodeId: nodeToExecute,
          knowledgeItems: knowledgeItems,
          agent: agent, // Pass the full agent object
        };
        
        const flowResult = await executeAgentFlow(flowInput);
        
        const agentMessagesForHistory = flowResult.messagesToSend.filter(m => !m.startsWith("(System:")).map(m => `Agent: ${m}`);
        const finalContext = {
            ...flowResult.updatedContext,
            conversationHistory: [...(inputContext.conversationHistory || []), ...agentMessagesForHistory]
        };


        if (flowResult.error) {
           return NextResponse.json({
             type: 'flow',
             messages: flowResult.messagesToSend,
             newFlowState: flowResult.nextNodeId ? { context: finalContext, nextNodeId: flowResult.nextNodeId } : undefined,
             isFlowFinished: flowResult.isFlowFinished,
             error: flowResult.error 
           }, { status: 200 });
        }

        return NextResponse.json({ 
          type: 'flow',
          messages: flowResult.messagesToSend,
          newFlowState: flowResult.nextNodeId ? { context: finalContext, nextNodeId: flowResult.nextNodeId } : undefined,
          isFlowFinished: flowResult.isFlowFinished,
        }, { status: 200 });
      }
    }

    // --- Fallback to Autonomous Reasoning ---
    let reasoningContextString = conversationHistoryString || "";
     if (flowState?.context?.conversationHistory && Array.isArray(flowState.context.conversationHistory)) {
        reasoningContextString = flowState.context.conversationHistory.join('\n');
    }
    if (reasoningContextString) {
        reasoningContextString += `\nUser: ${userInput}`;
    } else {
        reasoningContextString = `User: ${userInput}`;
    }
    
    const reasoningInput: AutonomousReasoningInput = {
      agentName: agent.generatedName,
      agentPersona: agent.generatedPersona,
      agentRole: agent.role,
      context: reasoningContextString,
      userInput: userInput,
      knowledgeItems: knowledgeItems,
    };
    
    const result = await autonomousReasoning(reasoningInput);

    return NextResponse.json({ 
      type: 'autonomous',
      reply: result.responseToUser,
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API Error for agent ${agentId} | Message: ${userInput.substring(0,50)} | Error:`, error);
    if (error.message.includes("Agent not found")) { 
        return createErrorResponse(404, error.message);
    }
    return createErrorResponse(500, 'An unexpected error occurred while processing your request.', { internalError: error.message });
  }
}
