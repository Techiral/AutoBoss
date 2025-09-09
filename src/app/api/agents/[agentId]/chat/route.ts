
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
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
    
    let mcpResult: string | null = null;
    if (agentConfig.mcpServerUrl) {
      const lc = userInput.toLowerCase();
      const wantsList = /(what|which).*(tools|capabilities)|list (tools|capabilities)/i.test(lc);
      const wantsFindDoc = /(find).*(document|doc)/i.test(lc);
      const wantsCreateDoc = /(create|make).*(document|doc)/i.test(lc);
      const wantsAppendText = /(append|add).*(text|content)/i.test(lc);
      
      let client: Client | null = null;
      let transport: StreamableHTTPClientTransport | null = null;

      try {
        if (wantsList || wantsFindDoc || wantsCreateDoc || wantsAppendText) {
            client = new Client(
              { name: "autoboss-backend-client", version: "1.0.0" },
              { capabilities: {} }
            );
            transport = new StreamableHTTPClientTransport(new URL(agentConfig.mcpServerUrl));
            await client.connect(transport);
        }

        if (client) {
            if (wantsList) {
              console.log("MCP request detected: listing tools");
              const tools = await client.listTools();
              mcpResult = `Available MCP tools:\n${JSON.stringify(tools, null, 2)}`;
            } else if (wantsFindDoc) {
                let title: string | undefined;
                const quotedMatch = userInput.match(/"([^"]+)"|'([^']+)'/);
                if (quotedMatch) {
                  title = quotedMatch[1] || quotedMatch[2];
                } else {
                  const namedMatch = userInput.match(/(?:named|titled) ([^\s.,;!?]+)/i);
                  if (namedMatch) {
                    title = namedMatch[1];
                  }
                }

                if (!title) {
                  mcpResult = `To find a Google Doc, please include the document title in quotes (e.g., "find a document titled 'My Report'") or use the word "named" (e.g., "find the doc named MyReport").`;
                } else {
                  console.log(`MCP request detected: finding document with title "${title}"`);
                  const result = await client.callTool({
                    name: "google_docs_find_a_document",
                    arguments: {
                      instructions: "Execute the Google Docs: Find a Document tool with the following parameters",
                      title: title,
                    },
                  });
                  mcpResult = `Found document "${title}":\n${JSON.stringify(result, null, 2)}`;
                }
            } else if (wantsCreateDoc) {
              const titleMatch = userInput.match(/"([^"]+)"|'([^']+)'/);
              const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : "New Document";
              
              if (titleMatch) {
                console.log(`MCP request detected: creating document with title "${title}"`);
                const result = await client.callTool({
                  name: "google_docs_create_document_from_text",
                  arguments: { 
                    title,
                    text: "Document created via AutoBoss MCP integration"
                  }
                });
                mcpResult = `Created document "${title}":\n${JSON.stringify(result, null, 2)}`;
              } else {
                mcpResult = `To create a document, please include the title in quotes. For example: "create a document titled 'My New Doc'"`;
              }
            } else if (wantsAppendText) {
              const textMatch = userInput.match(/"([^"]+)"|'([^']+)'/);
              const text = textMatch ? (textMatch[1] || textMatch[2]) : undefined;
              
              if (text) {
                console.log(`MCP request detected: appending text "${text}"`);
                mcpResult = `To append text, I need a document ID. For now, here's what would be appended: "${text}"`;
              } else {
                mcpResult = `To append text, please include the content in quotes. For example: "append text 'New content here'"`;
              }
            }
        }
      } catch (mcpError) {
        console.error("MCP execution failed:", mcpError);
        mcpResult = `MCP execution failed: ${mcpError instanceof Error ? mcpError.message : 'Unknown error'}`;
      } finally {
          if (transport) await transport.close();
          if (client) await client.close();
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
    
    let finalResponse = result.responseToUser;
    if (mcpResult) {
      finalResponse = `🔧 **MCP Tools Used**\n\n${mcpResult}\n\n---\n\n${result.responseToUser}`;
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

    batch.set(conversationRef, currentConversation);

    const agentRef = adminDb.collection('agents').doc(agentId);
    batch.update(agentRef, {
        'analytics.totalMessages': FieldValue.increment(2),
        ...(isNewConversation && { 'analytics.totalConversations': FieldValue.increment(1) })
    });
    
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
