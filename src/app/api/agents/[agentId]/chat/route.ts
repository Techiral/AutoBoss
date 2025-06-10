
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
// Removed: import { executeAgentFlow, ExecuteAgentFlowInput } from '@/ai/flows/execute-agent-flow'; // Flow engine removed
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent, KnowledgeItem, AgentLogicType, ChatMessage } from '@/lib/types';

// Helper to convert Firestore Timestamps in agent data
const convertAgentForApi = (agentData: any): Agent => {
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
  // Removed: flow conversion
  return newAgent as Agent;
};

// Zod Schemas for Request and Response
const RequestBodySchema = z.object({
  message: z.string().describe("User's input message."),
  conversationHistory: z.array(z.string()).optional().describe("A list of past messages in 'Sender: Message' format. Example: ['User: Hello', 'Agent: Hi there!']"),
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

  const { message: userInput, conversationHistory: clientHistory } = requestBody;
  console.log(`API Route (Simplified): Received request for agent ${agentId}. UserInput: "${userInput ? userInput.substring(0,50) + '...' : 'N/A'}"`);


  try {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return createErrorResponse(404, `Agent with ID '${agentId}' not found.`);
    }
    
    const agent = convertAgentForApi({ id: agentSnap.id, ...agentSnap.data() });
    const knowledgeItems = agent.knowledgeItems || [];
    const primaryLogic: AgentLogicType = agent.primaryLogic || 'prompt'; // Default to prompt if not set

    // Construct conversation history for autonomousReasoning
    // The client now sends an array of strings.
    // The API assumes the client has appended the current user message to its history if it wants it included for context.
    // However, autonomousReasoning expects a single string and also the latest user input separately.
    
    const historyForAutonomousReasoning = (clientHistory || []).join('\n');

    console.log(`API Route (Simplified): Executing autonomousReasoning for agent ${agentId}. Primary Logic: ${primaryLogic}`);
    
    const reasoningInput: AutonomousReasoningInput = {
      agentName: agent.generatedName,
      agentPersona: agent.generatedPersona,
      agentRole: agent.role,
      context: historyForAutonomousReasoning, // Stringified history
      userInput: userInput,
      knowledgeItems: knowledgeItems, 
    };
    
    const result = await autonomousReasoning(reasoningInput);
    
    // For the client, we'll return the agent's reply and potentially the updated history.
    // The client will manage its own message list.
    const updatedHistory = [...(clientHistory || []), `User: ${userInput}`, `Agent: ${result.responseToUser}`];

    return NextResponse.json({ 
      type: primaryLogic, // Can be 'prompt' or 'rag'
      reply: result.responseToUser,
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds,
      // For simplicity, let client manage its history display.
      // We could return updatedHistory if client wants server to be source of truth.
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API Route (Simplified): Unhandled error for agent ${agentId} | UserInput: "${userInput ? userInput.substring(0,50) + '...' : 'N/A'}" | Error:`, error.message, error.stack);
    if (error.message.includes("Agent not found")) { 
        return createErrorResponse(404, error.message);
    }
    return createErrorResponse(500, 'An unexpected error occurred while processing your request.', { internalError: error.message });
  }
}

