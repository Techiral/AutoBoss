
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Agent } from '@/lib/types';
// TODO: For full conversation, you might need to refactor Genkit flows (executeAgentFlow, autonomousReasoning)
// to be callable from a pure server-side context or via an internal API.

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
    // Twilio sends data as x-www-form-urlencoded
    const requestBody = await request.formData();
    const twilioData = Object.fromEntries(requestBody.entries());
    
    console.log(`[${timestamp}] Twilio Request Data for ${agentId}:`, twilioData);

    const speechResult = twilioData.SpeechResult as string | undefined;
    const callSid = twilioData.CallSid as string;

    // Fetch agent configuration
    let agent: Agent | null = null;
    try {
      const agentRef = doc(db, 'agents', agentId);
      const agentSnap = await getDoc(agentRef);
      if (agentSnap.exists()) {
        agent = convertAgentDataForVoice({ id: agentSnap.id, ...agentSnap.data() });
      }
    } catch (dbError: any) {
      console.error(`[${timestamp}] Firestore error fetching agent ${agentId}:`, dbError);
      twiml.say({ voice: 'alice' }, 'There was an issue retrieving agent information. Please try again later.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
    }

    if (!agent) {
      console.warn(`[${timestamp}] Agent ${agentId} not found in Firestore.`);
      twiml.say({ voice: 'alice' }, `Sorry, the requested agent with ID ${agentId} could not be found.`);
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
    }

    let agentResponseText = agent.generatedGreeting || `Hello, you've reached ${agent.generatedName || agent.name}.`;

    if (speechResult) {
      console.log(`[${timestamp}] User speech for ${callSid} (Agent: ${agent.id}): "${speechResult}"`);
      
      // --- Placeholder for Full Agent Logic Invocation ---
      // This is where you would:
      // 1. Retrieve conversation history for this callSid (if any).
      // 2. Pass `speechResult` and history to your agent's core logic 
      //    (e.g., a refactored `executeAgentFlow` or `autonomousReasoning`).
      // 3. Get the dynamic `responseText` from your agent.
      // 4. Update conversation history.
      // For now, we use a more dynamic placeholder.
      agentResponseText = `Okay, I understand you said: "${speechResult}". This agent is currently in training for full voice conversations. Please check back later for more advanced interactions.`;
      // --- End Placeholder ---

    } else {
      // Initial interaction or gather timeout
      console.log(`[${timestamp}] Initial interaction or gather timeout for ${callSid} (Agent: ${agent.id}). Greeting with: "${agentResponseText}"`);
    }
    
    twiml.say({ voice: 'alice', language: 'en-US' }, agentResponseText);

    // Gather user's next input
    const gather = twiml.gather({
      input: 'speech',
      action: `/api/agents/${agentId}/voice-hook`, // Twilio will POST back to this same URL
      speechTimeout: 'auto', 
      timeout: 5, 
      // Consider adding:
      // language: 'en-US', // Or dynamically based on agent config
      // hints: 'common phrases, yes, no, support, sales', // If applicable
    });
    // Optional: If gather times out without new speech, what should the agent say?
    // gather.say('I didn't hear anything. Is there anything else?'); 

    // If you always want to give the user a chance to speak again after the agent talks.
    // If you want the call to end if the user doesn't respond to the gather prompt,
    // you might add a twiml.hangup() after the gather if action doesn't receive a response.
    // For now, it will loop back to this webhook.

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
  
  // Securely get these from your server's environment variables
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
    },
  }, { status: 200 });
}
