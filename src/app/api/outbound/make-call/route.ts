
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { z } from 'zod';

const CallRequestBodySchema = z.object({
  to: z.string().min(10, "Recipient phone number is required and seems too short."), // Basic validation
  agentId: z.string().min(1, "Agent ID is required to initiate the call context."),
});

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Received request for /api/outbound/make-call`);

  let requestBody;
  try {
    requestBody = CallRequestBodySchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[${timestamp}] Validation Error:`, error.errors);
      return NextResponse.json({ success: false, error: "Invalid request body.", details: error.errors }, { status: 400 });
    }
    console.error(`[${timestamp}] Error parsing JSON:`, error);
    return NextResponse.json({ success: false, error: "Malformed JSON in request body." }, { status: 400 });
  }

  const { to, agentId } = requestBody;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error(`[${timestamp}] Twilio environment variables for making calls not fully set.`);
    return NextResponse.json({ success: false, error: "Twilio call configuration is missing on the server." }, { status: 500 });
  }
  if (!appDomain) {
    console.error(`[${timestamp}] NEXT_PUBLIC_APP_DOMAIN environment variable not set. Cannot construct TwiML URL.`);
    return NextResponse.json({ success: false, error: "Application domain for TwiML URL is not configured." }, { status: 500 });
  }
  
  const client = twilio(accountSid, authToken);
  const voiceHookUrl = `${appDomain}/api/agents/${agentId}/voice-hook`;

  try {
    const call = await client.calls.create({
      to: to,
      from: twilioPhoneNumber,
      url: voiceHookUrl, // URL Twilio will request when the call connects
      // method: 'POST', // Default is POST
      // statusCallback: `${appDomain}/api/twilio/status-callback`, // Optional: for call status updates
      // statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });
    console.log(`[${timestamp}] Outbound call initiated successfully. SID: ${call.sid} To: ${to} AgentID: ${agentId}`);
    return NextResponse.json({ success: true, callSid: call.sid, status: call.status });
  } catch (error: any) {
    console.error(`[${timestamp}] Error initiating call via Twilio to ${to} for agent ${agentId}:`, error);
    return NextResponse.json({ success: false, error: "Failed to initiate call.", details: error.message }, { status: 500 });
  }
}
