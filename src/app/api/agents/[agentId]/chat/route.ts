
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import { MCPIntegrationService } from '@/lib/mcp-integration';
import type { Agent, AgentLogicType, ChatMessage, KnowledgeItem, Conversation } from '@/lib/types';
import { KnowledgeItemSchema, AgentToneSchema } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin'; // Using Firebase Admin SDK
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Zod Schema for the agent configuration passed in the body
const AgentConfigSchema = z.object({
  userId: z.string().describe("The ID of the user who owns the agent."),
  generatedName: z.string().optional(),
  generatedPersona: z.string().optional(),
  role: z.string().optional(),
  agentTone: AgentToneSchema.optional(),
  primaryLogic: z.custom<AgentLogicType>().optional(),
  knowledgeItems: z.array(KnowledgeItemSchema).optional(),
  mcpServerUrl: z.string().url().optional().describe("Optional MCP server URL for external tool access."),
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
  { params: { agentId } }: { params: { agentId: string } }
) {
  const rawBody = await request.json();

  if (!agentId) {
    return createErrorResponse(400, "Agent ID is missing in the path.");
  }

  let requestBody: ApiRequestBody;
  try {
    requestBody = RequestBodySchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, "Invalid request body.", { issues: error.errors });
    }
    return createErrorResponse(400, "Malformed JSON in request body.");
  }

  const { message: userInput, conversationId: clientConversationId, agentConfig } = requestBody;
  console.log(`API Route (Stateful): Received request for agent ${agentId}. Conversation ID: ${clientConversationId || '(new)'}`);

  const batch = adminDb.batch();
  const conversationId = clientConversationId || adminDb.collection("conversations").doc().id;
  const conversationRef = adminDb.collection("conversations").doc(conversationId);
  const isNewConversation = !clientConversationId;

  try {
    let currentConversation: Conversation;
    if (isNewConversation) {
      currentConversation = {
        id: conversationId,
        agentId: agentId,
        userId: agentConfig.userId,
        createdAt: FieldValue.serverTimestamp() as Timestamp,
        updatedAt: FieldValue.serverTimestamp() as Timestamp,
        status: 'ongoing',
        messages: [],
        messageCount: 0,
      };
    } else {
      const conversationSnap = await conversationRef.get();
      if (!conversationSnap.exists) {
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
    
    // Check if MCP should be used for this request
    let mcpResult: string | null = null;
    if (agentConfig.mcpServerUrl && userInput.toLowerCase().includes('mcp') || 
        userInput.toLowerCase().includes('tool') || 
        userInput.toLowerCase().includes('external') ||
        userInput.toLowerCase().includes('google docs') ||
        userInput.toLowerCase().includes('zapier')) {
      
      console.log(`MCP request detected, using MCP server: ${agentConfig.mcpServerUrl}`);
      
      try {
        const mcpService = new MCPIntegrationService();
        mcpResult = await mcpService.executeWithMCP(userInput, agentConfig.mcpServerUrl);
        console.log("MCP execution result:", mcpResult);
      } catch (mcpError) {
        console.error("MCP execution failed:", mcpError);
        mcpResult = `MCP execution failed: ${mcpError instanceof Error ? mcpError.message : 'Unknown error'}`;
      }
    }
    
    const reasoningInput: AutonomousReasoningInput = {
      agentName: agentConfig.generatedName,
      agentPersona: agentConfig.generatedPersona,
      agentRole: agentConfig.role,
      agentTone: agentConfig.agentTone || "neutral",
      context: historyForAutonomousReasoning,
      userInput: userInput,
      knowledgeItems: primaryLogic === 'rag' ? agentConfig.knowledgeItems : [],
      mcpServerUrl: agentConfig.mcpServerUrl,
    };
    
    const result = await autonomousReasoning(reasoningInput);
    
    // If MCP was used, incorporate the result into the agent's response
    let finalResponse = result.responseToUser;
    if (mcpResult) {
      finalResponse = `I've used my MCP tools to help with your request. Here's what I found:\n\n${mcpResult}\n\n${result.responseToUser}`;
    }
    
    const agentMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'agent',
      text: finalResponse,
      timestamp: Date.now(),
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds,
    };
    currentConversation.messages.push(agentMessage);
    currentConversation.updatedAt = FieldValue.serverTimestamp() as Timestamp;
    currentConversation.messageCount = currentConversation.messages.length;

    // Add conversation update to the batch
    batch.set(conversationRef, currentConversation);

    // Add agent analytics update to the batch
    const agentRef = adminDb.collection('agents').doc(agentId);
    batch.update(agentRef, {
        'analytics.totalMessages': FieldValue.increment(2),
        ...(isNewConversation && { 'analytics.totalConversations': FieldValue.increment(1) })
    });
    
    // Commit all writes at once
    await batch.commit();

    return NextResponse.json({ 
      reply: finalResponse,
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds,
      conversationId: conversationId,
      mcpUsed: !!mcpResult,
      mcpResult: mcpResult,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API Route: Unhandled error for agent ${agentId} | Conversation ID: ${conversationId} | Error:`, error.message, error.stack);
    return createErrorResponse(500, 'Oops! Something went wrong on our end while processing your request. Please try again in a moment.', { internalError: error.message });
  }
}
