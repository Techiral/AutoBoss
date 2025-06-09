
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent } from '@/lib/types';
// Assuming you might refactor agent logic to be callable from server-side:
// import { getAgentResponseForVoice } from '@/server-lib/agent-voice-handler'; 
// This ^ is a conceptual import, you'd need to create this.

// Helper to convert Firestore Timestamps in agent data (if fetching agent details here)
const convertAgentForFlow = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  // Add other timestamp conversions if necessary (e.g., knowledgeItems)
  return newAgent as Agent;
};


export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio Voice Hook POST for Agent ID: ${agentId}`);

  // Twilio sends data as x-www-form-urlencoded
  const requestBody = await request.formData();
  const twilioData = Object.fromEntries(requestBody.entries());
  
  console.log(`[${timestamp}] Twilio Request Data:`, twilioData);

  const twiml = new twilio.twiml.VoiceResponse();

  // TODO: Securely fetch TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from environment variables
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // if (!accountSid || !authToken) {
  //   console.error(`[${timestamp}] Twilio credentials not configured on server.`);
  //   twiml.say('System configuration error. Unable to process call.');
  //   twiml.hangup();
  //   return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
  // }
  // const client = twilio(accountSid, authToken);

  // TODO: Optional - Verify the request is from Twilio
  // const twilioSignature = request.headers.get('X-Twilio-Signature');
  // const fullUrl = request.url; // Or construct it from headers/host
  // if (!twilio.validateRequest(authToken, twilioSignature || '', fullUrl, Object.fromEntries(requestBody.entries()))) {
  //   console.warn(`[${timestamp}] Invalid Twilio signature for Agent ID: ${agentId}`);
  //   return new NextResponse('Invalid Twilio Signature', { status: 403 });
  // }

  const speechResult = twilioData.SpeechResult as string | undefined;
  const callSid = twilioData.CallSid as string;
  const fromNumber = twilioData.From as string;

  let agentResponseText = `Hello from AutoBoss agent ${agentId}.`; // Default or initial greeting

  // ==================================================================
  // == STAGE 1: Initial Greeting or Processing User Speech          ==
  // ==================================================================
  if (speechResult) {
    console.log(`[${timestamp}] User speech for ${callSid}: "${speechResult}"`);
    // ** Placeholder for Agent Logic Invocation **
    // Here, you would:
    // 1. Fetch the agent's full configuration (persona, flow, knowledge) from Firestore using agentId.
    //    const agentRef = doc(db, 'agents', agentId);
    //    const agentSnap = await getDoc(agentRef);
    //    if (!agentSnap.exists()) { /* handle agent not found */ }
    //    const agentData = convertAgentForFlow(agentSnap.data());
    //
    // 2. Get conversation history for this callSid (e.g., from a database or cache).
    //
    // 3. Call your agent's conversational logic:
    //    - If using a predefined flow:
    //      const flowInput = { flowDefinition: agentData.flow, currentContext: { conversationHistory: [...] }, currentMessage: speechResult, agent: agentData, knowledgeItems: agentData.knowledgeItems };
    //      const flowOutput = await executeAgentFlow(flowInput); // Needs refactoring for server-side
    //      agentResponseText = flowOutput.messagesToSend.join(' ') || "I'm not sure how to respond to that.";
    //      // Update conversation history & flow state for this callSid
    //    - Or, if using autonomous reasoning:
    //      const reasoningInput = { userInput: speechResult, context: "...", agentName: agentData.name, ... };
    //      const reasoningOutput = await autonomousReasoning(reasoningInput); // Needs refactoring
    //      agentResponseText = reasoningOutput.responseToUser;
    //      // Update conversation history for this callSid
    //
    // For now, we'll just echo or give a canned response:
    agentResponseText = `You said: ${speechResult}. How can I help you further?`;
    // End Placeholder for Agent Logic Invocation

  } else {
    // This is likely the first interaction (call connected, no speech from user yet)
    // Or a Gather timed out without speech.
    // Fetch agent's initial greeting
    // const agentRef = doc(db, 'agents', agentId);
    // const agentSnap = await getDoc(agentRef);
    // if (agentSnap.exists()) {
    //   const agentData = convertAgentForFlow(agentSnap.data());
    //   agentResponseText = agentData.generatedGreeting || `Welcome to agent ${agentId}. How can I assist?`;
    // } else {
    //   agentResponseText = `Agent ${agentId} not found. Goodbye.`;
    //   twiml.say(agentResponseText);
    //   twiml.hangup();
    //   return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
    // }
    console.log(`[${timestamp}] Initial interaction or gather timeout for ${callSid}.`);
  }
  
  // ==================================================================
  // == STAGE 2: Construct TwiML Response                          ==
  // ==================================================================
  twiml.say({ voice: 'alice', language: 'en-US' }, agentResponseText);

  // Gather user's next input
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/agents/${agentId}/voice-hook`, // Twilio will POST back to this same URL
    speechTimeout: 'auto', // Or a specific number of seconds
    timeout: 5, // Seconds to wait for speech after prompt
    // speechModel: 'phone_call', // Optional: optimize for phone audio
    // enhanced: true, // Optional: for better recognition accuracy
  });
  gather.say('Is there anything else?'); // Prompt if user is silent after agent speaks

  // If Gather times out or user says nothing, Twilio will POST again to 'action' URL,
  // but without SpeechResult. You can handle that as a "silence" case.
  // If you don't want to loop, you can add a <Hangup/> after the <Say>
  // twiml.hangup();

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });

} catch (error: any) {
  console.error(`[${timestamp}] Error in Twilio Voice Hook for agent ${agentId}:`, error);
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ voice: 'alice', language: 'en-US' }, 'Sorry, an error occurred with the AutoBoss voice agent.');
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
  
  return NextResponse.json({ 
    message: `AutoBoss Voice Hook for agent ${agentId} is active. This endpoint expects POST requests from Twilio for call interactions.`,
    details: "Configure your Twilio phone number's voice webhook to POST to this URL.",
    requiredEnvVars: [
      "TWILIO_ACCOUNT_SID (for SDK usage, not strictly for basic TwiML)",
      "TWILIO_AUTH_TOKEN (for SDK usage and request validation)",
      "TWILIO_PHONE_NUMBER (for reference, if your agent needs to know its own number)"
    ]
  }, { status: 200 });
}
