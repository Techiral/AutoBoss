
import { NextRequest, NextResponse } from 'next/server';
import { autonomousReasoning, AutonomousReasoningInput } from '@/ai/flows/autonomous-reasoning';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent, KnowledgeItem } from '@/lib/types';

// Helper to convert Firestore Timestamps in agent data to ISO strings for consistency if needed by flows
// For knowledgeItems, ensuring uploadedAt is string for the flow.
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
  return newAgent as Agent;
};


export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;

  try {
    const body = await request.json();
    const userInput = body.message;
    const conversationHistoryString = body.history; // Assuming history is passed as a string "User: Hi\nAgent: Hello"

    if (!userInput) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch agent definition from Firestore
    const agentRef = doc(db, 'agents', agentId as string);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    const agentDataFromDb = agentSnap.data();
    const agent = convertAgentForFlow({ id: agentSnap.id, ...agentDataFromDb });

    // For this API, we'll primarily use autonomousReasoning.
    // A more advanced version could attempt to execute the agent's specific flow.
    // For simplicity, the API provides a direct line to autonomous reasoning with the agent's knowledge.

    const context = conversationHistoryString ? 
      `${conversationHistoryString}\nUser: ${userInput}` : 
      `User: ${userInput}`;
      
    const reasoningInput: AutonomousReasoningInput = {
      context: context,
      userInput: userInput,
      knowledgeItems: agent.knowledgeItems || [],
    };
    
    const result = await autonomousReasoning(reasoningInput);

    return NextResponse.json({ 
      reply: result.responseToUser,
      reasoning: result.reasoning,
      // agentPersona: agent.generatedPersona // Could be useful for client to know
    });

  } catch (error: any) {
    console.error(`Error in agent API for ID ${agentId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to process message' }, { status: 500 });
  }
}
