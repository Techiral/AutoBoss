
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, Timestamp, collection } from 'firebase/firestore';
import type { Agent, Conversation, ChatMessage } from '@/lib/types';
import { generateVoiceResponse, VoiceResponseInput } from '@/ai/flows/voice-response-flow';


const convertAgentDataForVoice = (agentData: any): Agent => {
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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio Voice Hook POST for Agent ID: ${agentId}`);

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const requestBody = await request.formData();
    const twilioData = Object.fromEntries(requestBody.entries());
    
    console.log(`[${timestamp}] Twilio Request Data for ${agentId}:`, JSON.stringify(twilioData));
    
    const speechResult = twilioData.SpeechResult as string | undefined;
    const callSid = twilioData.CallSid as string;

    const agentRef = adminDb.doc(`agents/${agentId}`);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      console.warn(`[${timestamp}] Agent ${agentId} not found in Firestore.`);
      twiml.say({ voice: 'alice' }, `Sorry, the requested agent could not be found.`);
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
    }
    
    const agent = convertAgentDataForVoice({ id: agentSnap.id, ...(agentSnap.data() || {}) });

    const conversationRef = adminDb.doc(`conversations/${callSid}`);
    const conversationSnap = await getDoc(conversationRef);
    let conversation: Conversation;

    if (conversationSnap.exists()) {
        conversation = conversationSnap.data() as Conversation;
    } else {
        conversation = {
            id: callSid,
            agentId: agent.id,
            userId: agent.userId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: 'ongoing',
            messages: [],
            messageCount: 0,
        };
    }

    let agentResponseText = agent.generatedGreeting || `Hello, you've reached ${agent.generatedName || agent.name}. How can I help?`;

    if (speechResult && speechResult.trim()) {
        console.log(`[${timestamp}] User speech for ${callSid}: "${speechResult}"`);
        
        const userMessage: ChatMessage = {
            id: `msg-user-${Date.now()}`,
            sender: 'user',
            text: speechResult,
            timestamp: Date.now()
        };
        conversation.messages.push(userMessage);

        const historyForFlow = conversation.messages.map(msg => `${msg.sender === 'user' ? 'User' : 'Agent'}: ${msg.text}`);
        
        const voiceInput: VoiceResponseInput = {
            userInput: speechResult,
            agentName: agent.generatedName,
            agentPersona: agent.generatedPersona,
            agentRole: agent.role,
            agentTone: agent.agentTone || "neutral",
            shortHistory: historyForFlow,
            knowledgeItems: agent.primaryLogic === 'rag' ? agent.knowledgeItems : [],
        };
        
        try {
            const llmResponse = await generateVoiceResponse(voiceInput);
            agentResponseText = llmResponse.agentResponse;
            console.log(`[${timestamp}] LLM Voice Response for ${callSid}: "${agentResponseText}"`);
        } catch (flowError: any) {
            console.error(`[${timestamp}] Error calling generateVoiceResponse flow for ${callSid}:`, flowError);
            agentResponseText = "I'm having a little trouble understanding right now. Could you please repeat that?";
        }
        
        const agentMessage: ChatMessage = {
            id: `msg-agent-${Date.now()}`,
            sender: 'agent',
            text: agentResponseText,
            timestamp: Date.now()
        };
        conversation.messages.push(agentMessage);
    } else if (conversation.messages.length === 0) {
        // Initial greeting
        const agentGreetingMessage: ChatMessage = {
            id: `msg-agent-greeting-${Date.now()}`,
            sender: 'agent',
            text: agentResponseText,
            timestamp: Date.now()
        };
        conversation.messages.push(agentGreetingMessage);
    }

    conversation.updatedAt = Timestamp.now();
    conversation.messageCount = conversation.messages.length;

    await setDoc(conversationRef, conversation);

    const maleVoices = ['Calvin', 'Enceladus'];
    const twilioVoice = agent.voiceName && maleVoices.includes(agent.voiceName) ? 'man' : 'alice';

    twiml.say({ voice: twilioVoice, language: 'en-US' }, agentResponseText);
    
    const actionUrl = new URL(`/api/agents/${agentId}/voice-hook`, request.nextUrl.origin);
    twiml.gather({
      input: ['speech'],
      action: actionUrl.pathname, // No more URL params for history
      speechTimeout: 'auto',
      timeout: 5,
      profanityFilter: true,
      language: 'en-US',
    });

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });

  } catch (error: any) {
    console.error(`[${timestamp}] General error in Twilio Voice Hook for agent ${agentId}:`, error);
    twiml.say({ voice: 'alice' }, 'Sorry, an unexpected error occurred with the voice agent.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
        status: 500,
        headers: { 'Content-Type': 'application/xml' },
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  return NextResponse.json({ 
    message: `This is the AutoBoss Voice Hook for Agent ID: ${agentId}. It's ready to receive POST requests from Twilio.`,
  }, { status: 200 });
}
