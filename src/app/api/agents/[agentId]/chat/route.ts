
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import type { Agent, AgentLogicType, ChatMessage, KnowledgeItem } from '@/lib/types';
import { KnowledgeItemSchema, AgentToneSchema } from '@/lib/types';

// Zod Schema for the agent configuration passed in the body
const AgentConfigSchema = z.object({
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
  conversationHistory: z.array(z.string()).optional().describe("A list of past messages in 'Sender: Message' format."),
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

  const { message: userInput, conversationHistory: clientHistory, agentConfig } = requestBody;
  console.log(`API Route (Stateless): Received request for agent ${agentId}. UserInput: "${userInput ? userInput.substring(0,50) + '...' : 'N/A'}"`);

  try {
    const historyForAutonomousReasoning = (clientHistory || []).join('\n');
    const primaryLogic = agentConfig.primaryLogic || 'prompt';
    
    console.log(`API Route (Stateless): Executing autonomousReasoning for agent ${agentId}. Primary Logic: ${primaryLogic}, Tone: ${agentConfig.agentTone}`);
    
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
    
    const updatedHistory = [...(clientHistory || []), `User: ${userInput}`, `Agent: ${result.responseToUser}`];

    return NextResponse.json({ 
      type: primaryLogic, 
      reply: result.responseToUser,
      reasoning: result.reasoning,
      relevantKnowledgeIds: result.relevantKnowledgeIds,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API Route (Stateless): Unhandled error for agent ${agentId} | UserInput: "${userInput ? userInput.substring(0,50) + '...' : 'N/A'}" | Error:`, error.message, error.stack);
    return createErrorResponse(500, 'Oops! Something went wrong on our end while processing your request. Please try again in a moment.', { internalError: error.message });
  }
}
    
