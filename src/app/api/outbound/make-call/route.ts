
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent, UserProfile } from '@/lib/types';

const CallRequestBodySchema = z.object({
  to: z.string().min(10, "Recipient phone number is required and seems too short."),
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

  let twilioClient;
  let fromPhoneNumber: string | undefined;
  let appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  let userAccountSid: string | null = null;
  let userAuthToken: string | null = null;
  let userTwilioPhoneNumber: string | null = null;

  if (agentId) {
     try {
      const agentRef = doc(db, 'agents', agentId);
      const agentSnap = await getDoc(agentRef);
      if (agentSnap.exists()) {
        const agentData = agentSnap.data() as Agent;
        if (agentData.userId) {
          const userRef = doc(db, 'users', agentData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userProfile = userSnap.data() as UserProfile;
            userAccountSid = userProfile.twilioAccountSid || null;
            userAuthToken = userProfile.twilioAuthToken || null;
            userTwilioPhoneNumber = userProfile.twilioPhoneNumber || null;
          }
        }
      }
    } catch (dbError) {
      console.error(`[${timestamp}] Error fetching user-specific Twilio config for make-call, agent ${agentId}:`, dbError);
    }
  }

  const accountSidToUse = userAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authTokenToUse = userAuthToken || process.env.TWILIO_AUTH_TOKEN;
  fromPhoneNumber = userTwilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER;


  if (!accountSidToUse || !authTokenToUse || !fromPhoneNumber) {
    console.error(`[${timestamp}] Twilio environment variables for making calls not fully set. User specific SID used: ${!!userAccountSid}, Global SID used: ${!!process.env.TWILIO_ACCOUNT_SID}`);
    return NextResponse.json({ success: false, error: "Twilio call configuration is missing on the server or for the user." }, { status: 500 });
  }
  if (!appDomain) {
    console.error(`[${timestamp}] NEXT_PUBLIC_APP_DOMAIN environment variable not set. Cannot construct TwiML URL.`);
    return NextResponse.json({ success: false, error: "Application domain for TwiML URL is not configured." }, { status: 500 });
  }
  
  twilioClient = twilio(accountSidToUse, authTokenToUse);
  console.log(`[${timestamp}] Making call using Twilio config: ${userAccountSid ? 'User-Specific' : 'Global/System'}`);
  const voiceHookUrl = `${appDomain}/api/agents/${agentId}/voice-hook`;

  try {
    const call = await twilioClient.calls.create({
      to: to,
      from: fromPhoneNumber,
      url: voiceHookUrl,
    });
    console.log(`[${timestamp}] Outbound call initiated successfully. SID: ${call.sid} To: ${to} AgentID: ${agentId}`);
    return NextResponse.json({ success: true, callSid: call.sid, status: call.status });
  } catch (error: any) {
    console.error(`[${timestamp}] Error initiating call via Twilio to ${to} for agent ${agentId}:`, error);
    return NextResponse.json({ success: false, error: "Failed to initiate call.", details: error.message }, { status: 500 });
  }
}
