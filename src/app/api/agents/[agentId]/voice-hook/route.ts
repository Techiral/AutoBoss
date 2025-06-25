
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent } from '@/lib/types';
import { generateVoiceResponse, VoiceResponseInput } from '@/ai/flows/voice-response-flow';

const MAX_HISTORY_ITEMS_IN_URL = 2; // Number of recent exchanges (1 user + 1 agent) = 4 items total (u1,a1,u2,a2)

// Helper to convert Firestore Timestamps in agent data
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
    const searchParams = request.nextUrl.searchParams;

    console.log(`[${timestamp}] Twilio Request Data for ${agentId}:`, JSON.stringify(twilioData));

    const speechResult = twilioData.SpeechResult as string | undefined;
    const callSid = twilioData.CallSid as string;

    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      console.warn(`[${timestamp}] Agent ${agentId} not found in Firestore.`);
      twiml.say({ voice: 'alice' }, `Sorry, the requested agent could not be found.`);
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
    }
    
    const agent = convertAgentDataForVoice({ id: agentSnap.id, ...agentSnap.data() });
    let agentResponseText = agent.generatedGreeting || `Hello, you've reached ${agent.generatedName || agent.name}. How can I help?`;
    
    const shortHistoryFromUrl: string[] = [];
    for(let i = 1; i <= MAX_HISTORY_ITEMS_IN_URL; i++) {
        const userMsg = searchParams.get(`u${i}`);
        const agentMsg = searchParams.get(`a${i}`);
        if (userMsg) shortHistoryFromUrl.push(`User: ${userMsg}`);
        if (agentMsg) shortHistoryFromUrl.push(`Agent: ${agentMsg}`);
    }
    
    let newHistoryForUrlParams: Record<string, string> = {};

    if (speechResult && speechResult.trim()) {
      console.log(`[${timestamp}] User speech for ${callSid} (Agent: ${agent.id}): "${speechResult}"`);
      
      const voiceInput: VoiceResponseInput = {
        userInput: speechResult,
        agentName: agent.generatedName,
        agentPersona: agent.generatedPersona,
        agentRole: agent.role,
        agentTone: agent.agentTone || "neutral",
        shortHistory: shortHistoryFromUrl,
        knowledgeItems: agent.knowledgeItems && agent.primaryLogic === 'rag' ? agent.knowledgeItems : undefined,
      };

      try {
        const llmResponse = await generateVoiceResponse(voiceInput);
        agentResponseText = llmResponse.agentResponse;
        console.log(`[${timestamp}] LLM Voice Response for ${callSid}: "${agentResponseText}"`);
      } catch (flowError: any) {
        console.error(`[${timestamp}] Error calling generateVoiceResponse flow for ${callSid}:`, flowError);
        agentResponseText = "I'm having a little trouble understanding right now. Could you please repeat that?";
      }
      
      const currentTurnHistory = [...shortHistoryFromUrl, `User: ${speechResult}`, `Agent: ${agentResponseText}`];
      const historyToPassOn = currentTurnHistory.slice(-MAX_HISTORY_ITEMS_IN_URL * 2); 
      
      let uIndex = 1, aIndex = 1;
      historyToPassOn.forEach(item => {
          if (item.startsWith("User: ") && uIndex <= MAX_HISTORY_ITEMS_IN_URL) {
              newHistoryForUrlParams[`u${uIndex++}`] = item.substring(6);
          } else if (item.startsWith("Agent: ") && aIndex <= MAX_HISTORY_ITEMS_IN_URL) {
              newHistoryForUrlParams[`a${aIndex++}`] = item.substring(7);
          }
      });

    } else {
      console.log(`[${timestamp}] Initial interaction or empty/timeout speech for ${callSid}. Greeting with: "${agentResponseText}"`);
      if (shortHistoryFromUrl.length > 0) {
        let uIndex = 1, aIndex = 1;
        shortHistoryFromUrl.forEach(item => {
            if (item.startsWith("User: ") && uIndex <= MAX_HISTORY_ITEMS_IN_URL) {
                newHistoryForUrlParams[`u${uIndex++}`] = item.substring(6);
            } else if (item.startsWith("Agent: ") && aIndex <= MAX_HISTORY_ITEMS_IN_URL) {
                newHistoryForUrlParams[`a${aIndex++}`] = item.substring(7);
            }
        });
      } else {
         newHistoryForUrlParams['a1'] = agentResponseText;
      }
    }
    
    // For reliability, the live voice hook now uses Twilio's built-in TTS.
    // The higher-quality custom voice from Genkit is used in the web-based test interface.
    twiml.say({ voice: 'alice', language: 'en-US' }, agentResponseText);

    const actionUrl = new URL(`/api/agents/${agentId}/voice-hook`, request.nextUrl.origin);
    Object.entries(newHistoryForUrlParams).forEach(([key, value]) => {
        actionUrl.searchParams.set(key, value);
    });
    
    twiml.gather({
      input: 'speech',
      action: actionUrl.pathname + actionUrl.search, 
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
