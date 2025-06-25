
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import type { Agent, AgentLogicType, ChatMessage, KnowledgeItem, Conversation } from '@/lib/types';
import { KnowledgeItemSchema, AgentToneSchema, ChatMessageSchema } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, Timestamp, writeBatch, increment } from 'firebase/firestore';

// Zod Schema for the agent configuration passed in the body
const AgentConfigSchema = z.object({
  userId: z.string().describe("The ID of the user who owns the agent."),
  generatedName: z.string().optional(),
  generatedPersona: z.string().optional(),
  role: z.string().optional(),
  agentTone: AgentToneSchema.optional(),
  primaryLogic: z.custom<AgentLogicType>().optional(),
  knowledgeItems: z.array(KnowledgeItemSchema).optional(),
});

// Zod Schema for the complete Request Body
const RequestBodySchema = z.object({
  message: z.string().describe("User's input message."),
  conversationId: z.string().optional().describe("ID of the ongoing conversation session."),
  agentConfig: AgentConfigSchema.describe("The necessary configuration of the agent to perform reasoning."),
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

  const { message: userInput, conversationId: clientConversationId, agentConfig } = requestBody;
  console.log(`API Route (Stateful): Received request for agent ${agentId}. Conversation ID: ${clientConversationId || '(new)'}`);

  const batch = writeBatch(db);
  const conversationId = clientConversationId || doc(collection(db, "conversations")).id;
  const conversationRef = doc(db, "conversations", conversationId);
  const isNewConversation = !clientConversationId;

  try {
    let currentConversation: Conversation;
    if (isNewConversation) {
      // Use the userId passed from the authenticated client context
      // This avoids a direct, unauthenticated read from the API
      currentConversation = {
        id: conversationId,
        agentId: agentId,
        userId: agentConfig.userId, // Storing the agent owner's ID from the payload
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'ongoing',
        messages: [],
        messageCount: 0,
      };
    } else {
      const conversationSnap = await getDoc(conversationRef);
      if (!conversationSnap.exists()) {
        return createErrorResponse(404, "Conversation session not found.");
      }
      currentConversation = conversationSnap.data() as Conversation;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: Date.now(),
    };
    currentConversation.messages.push(userMessage);

    const historyForAutonomousReasoning = currentConversation.messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Agent'}: ${msg.text}`)
      .join('\n');
    
    const primaryLogic = agentConfig.primaryLogic || 'prompt';
    console.log(`API Route: Executing autonomousReasoning for agent ${agentId}. Logic: ${primaryLogic}`);
    
    const reasoningInput: AutonomousReasoningInput = {
      agentName: agentConfig.generatedName,
      agentPersona: agentConfig.generatedPersona,
      agentRole: agentConfig.role,
      agentTone: agentConfig.agentTone || "neutral",
      context: historyForAutonomousReasoning,
      userInput: userInput,
      knowledgeItems: primaryLogic === 'rag' ? agentConfig.knowledgeItems : [],
    };
    
    const result = await autonomousReasoning(reasoningInput);
    
    const agentMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'agent',
      text: result.responseToUser,
      timestamp: Date.now(),
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds,
    };
    currentConversation.messages.push(agentMessage);
    currentConversation.updatedAt = Timestamp.now();
    currentConversation.messageCount = currentConversation.messages.length;

    // Add conversation update to the batch
    batch.set(conversationRef, currentConversation);

    // Add agent analytics update to the batch
    const agentRef = doc(db, 'agents', agentId);
    batch.update(agentRef, {
        'analytics.totalMessages': increment(2),
        ...(isNewConversation && { 'analytics.totalConversations': increment(1) })
    });
    
    // Commit all writes at once
    await batch.commit();

    return NextResponse.json({ 
      reply: result.responseToUser,
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds,
      conversationId: conversationId,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API Route: Unhandled error for agent ${agentId} | Conversation ID: ${conversationId} | Error:`, error.message, error.stack);
    return createErrorResponse(500, 'Oops! Something went wrong on our end while processing your request. Please try again in a moment.', { internalError: error.message });
  }
}
