
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent, AgentToneType } from '@/lib/types'; // Added AgentToneType
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
    console.log(`[${timestamp}] URL Query Params for ${agentId}:`, JSON.stringify(Object.fromEntries(searchParams.entries())));

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
    // Reconstruct history from u1, a1, u2, a2...
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
        agentTone: agent.agentTone || "neutral", // Pass agentTone
        shortHistory: shortHistoryFromUrl, // Pass the reconstructed history
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
      
      // Prepare history for next turn's URL: Add current exchange and keep latest
      const currentTurnHistory = [...shortHistoryFromUrl, `User: ${speechResult}`, `Agent: ${agentResponseText}`];
      const historyToPassOn = currentTurnHistory.slice(-MAX_HISTORY_ITEMS_IN_URL * 2); // Keep last N items (user+agent pairs)
      
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
      // If it's the very first interaction (no history in URL) or a gather timeout with no speech,
      // the agentResponseText is the greeting. We need to pass existing history if any, or this greeting as a1.
      if (shortHistoryFromUrl.length > 0) {
        let uIndex = 1, aIndex = 1;
        shortHistoryFromUrl.forEach(item => { // Pass existing history forward
            if (item.startsWith("User: ") && uIndex <= MAX_HISTORY_ITEMS_IN_URL) {
                newHistoryForUrlParams[`u${uIndex++}`] = item.substring(6);
            } else if (item.startsWith("Agent: ") && aIndex <= MAX_HISTORY_ITEMS_IN_URL) {
                newHistoryForUrlParams[`a${aIndex++}`] = item.substring(7);
            }
        });
      } else {
         // This is the very first response (the greeting), so set it as 'a1' for the next turn
         newHistoryForUrlParams['a1'] = agentResponseText;
      }
    }
    
    twiml.say({ voice: 'alice', language: 'en-US' }, agentResponseText);

    const actionUrl = new URL(`/api/agents/${agentId}/voice-hook`, request.nextUrl.origin);
    Object.entries(newHistoryForUrlParams).forEach(([key, value]) => {
        actionUrl.searchParams.set(key, value);
    });
    
    console.log(`[${timestamp}] Next Gather Action URL for ${callSid}: ${actionUrl.toString()}`);

    twiml.gather({
      input: 'speech',
      action: actionUrl.pathname + actionUrl.search, 
      speechTimeout: 'auto', // Let Twilio decide, or set e.g., '3s'
      timeout: 5, // Seconds to wait for speech after prompt
      profanityFilter: true, // Basic filter
      language: 'en-US', // Or make configurable per agent
      // hints: "yes, no, support, sales, help", // Optional: provide hints
    });
    
    // If gather times out, Twilio re-POSTs to the action URL without SpeechResult.
    // The logic above will replay the agentResponseText (which was the last thing said by agent or the greeting).

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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio Voice Hook GET for Agent ID: ${agentId}`);
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  return NextResponse.json({ 
    message: `AutoBoss Voice Hook for agent ${agentId} is active. This endpoint expects POST requests from Twilio for call interactions.`,
    status: "Healthy",
    configuration_notes: {
      twilio_phone_number_to_configure: `Ensure your Twilio phone number's voice webhook (A call comes in -> Webhook) is set to POST to this URL: ${request.nextUrl.origin}/api/agents/${agentId}/voice-hook`,
      required_env_vars_on_server: [
        `TWILIO_ACCOUNT_SID: ${accountSid ? 'Set' : 'NOT SET - Required for SDK use and validation'}`,
        `TWILIO_AUTH_TOKEN: ${authToken ? 'Set' : 'NOT SET - Required for SDK use and validation'}`,
        `TWILIO_PHONE_NUMBER: ${twilioPhoneNumber || 'Not Set - For agent reference or outbound calls'}`,
      ],
      current_agent_id_in_path: agentId,
      history_passing_method: "Prototype via URL query parameters (u1, a1, u2, a2... for User/Agent turns). Limited robustness."
    },
  }, { status: 200 });
}

