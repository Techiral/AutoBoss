
import { NextRequest, NextResponse } from 'next/server';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import { executeAgentFlow, ExecuteAgentFlowInput } from '@/ai/flows/execute-agent-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent, KnowledgeItem, FlowContext, AgentFlowDefinition, ChatMessage as LibChatMessage } from '@/lib/types'; // Added ChatMessage for history

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
  // Ensure flow definition is included if it exists
  if (agentData.flow) {
    newAgent.flow = agentData.flow;
  }
  return newAgent as Agent;
};

interface ApiChatMessage {
  sender: 'user' | 'agent';
  text: string;
}

interface RequestBody {
  message: string;
  flowState?: {
    context: FlowContext;
    nextNodeId: string;
  };
  conversationHistoryString?: string; // For simpler autonomous mode if no flow state
}

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;

  try {
    const body: RequestBody = await request.json();
    const userInput = body.message;

    if (!userInput) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const agentRef = doc(db, 'agents', agentId as string);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    const agent = convertAgentForFlow({ id: agentSnap.id, ...agentSnap.data() });
    const knowledgeItems = agent.knowledgeItems || [];

    // --- Try Flow Execution First if applicable ---
    if (agent.flow) {
      let inputContext: FlowContext;
      let nodeToExecute: string | undefined;

      if (body.flowState?.context && body.flowState?.nextNodeId) {
        // Resume existing flow
        inputContext = body.flowState.context;
        nodeToExecute = body.flowState.nextNodeId;
      } else {
        // Start new flow
        inputContext = { conversationHistory: [] }; // Initialize with empty history for the flow
        nodeToExecute = agent.flow.nodes.find(n => n.type === 'start')?.id;
      }

      if (nodeToExecute) {
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: agent.flow,
          currentContext: inputContext,
          currentMessage: userInput, // The new message from the user
          startNodeId: nodeToExecute,
          knowledgeItems: knowledgeItems,
        };
        
        const flowResult = await executeAgentFlow(flowInput);

        return NextResponse.json({ 
          type: 'flow',
          messages: flowResult.messagesToSend,
          newFlowState: flowResult.nextNodeId ? { context: flowResult.updatedContext, nextNodeId: flowResult.nextNodeId } : undefined,
          isFlowFinished: flowResult.isFlowFinished,
          error: flowResult.error // Will be undefined if no error
        });
      }
    }

    // --- Fallback to Autonomous Reasoning ---
    // Build context string for autonomous reasoning
    let reasoningContextString = body.conversationHistoryString || "";
    if (!reasoningContextString.trim() && agent.generatedPersona) {
        // If history is empty, prime with persona for better first response
        reasoningContextString = `Agent Persona: ${agent.generatedPersona}\n`;
    }
    // Append current user input to the history string for autonomous reasoning
    // The autonomousReasoning flow itself expects 'context' (history) and 'userInput' separately.
    // Here, we'll pass the accumulated string as context.
    
    // The 'context' for autonomousReasoning should be the history *before* the current userInput.
    // 'userInput' is the current message.
    const autonomousInputContext = body.conversationHistoryString || 
      (agent.generatedPersona ? `You are an AI assistant with the following persona: ${agent.generatedPersona}. ` : "");


    const reasoningInput: AutonomousReasoningInput = {
      context: autonomousInputContext,
      userInput: userInput,
      knowledgeItems: knowledgeItems,
    };
    
    const result = await autonomousReasoning(reasoningInput);

    return NextResponse.json({ 
      type: 'autonomous',
      reply: result.responseToUser,
      reasoning: result.reasoning
    });

  } catch (error: any) {
    console.error(`Error in agent API for ID ${agentId}:`, error);
    // More specific error for JSON parsing issues
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to process message' }, { status: 500 });
  }
}
