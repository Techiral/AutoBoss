
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import type { Agent, UserProfile } from '@/lib/types';

const SmsRequestBodySchema = z.object({
  to: z.string().min(10, "Recipient phone number is required and seems too short."),
  body: z.string().min(1, "Message body cannot be empty."),
  agentId: z.string().optional().describe("ID of the agent related to this SMS, for fetching user-specific Twilio config."),
});

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Received request for /api/outbound/send-sms`);

  let requestBody;
  try {
    requestBody = SmsRequestBodySchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[${timestamp}] Validation Error:`, error.errors);
      return NextResponse.json({ success: false, error: "Invalid request body.", details: error.errors }, { status: 400 });
    }
    console.error(`[${timestamp}] Error parsing JSON:`, error);
    return NextResponse.json({ success: false, error: "Malformed JSON in request body." }, { status: 400 });
  }

  const { to, body, agentId } = requestBody;

  let twilioClient;
  let fromPhoneNumber: string | undefined;

  let userAccountSid: string | null = null;
  let userAuthToken: string | null = null;
  let userTwilioPhoneNumber: string | null = null;

  if (agentId) {
     try {
      const agentRef = adminDb.doc(`agents/${agentId}`);
      const agentSnap = await agentRef.get();
      if (agentSnap.exists) {
        const agentData = agentSnap.data() as Agent;
        if (agentData.userId) {
          const userRef = adminDb.doc(`users/${agentData.userId}`);
          const userSnap = await userRef.get();
          if (userSnap.exists) {
            const userProfile = userSnap.data() as UserProfile;
            userAccountSid = userProfile.twilioAccountSid || null;
            userAuthToken = userProfile.twilioAuthToken || null;
            userTwilioPhoneNumber = userProfile.twilioPhoneNumber || null;
          }
        }
      }
    } catch (dbError) {
      console.error(`[${timestamp}] Error fetching user-specific Twilio config from Firestore for agent ${agentId}:`, dbError);
    }
  }

  const accountSidToUse = userAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authTokenToUse = userAuthToken || process.env.TWILIO_AUTH_TOKEN;
  fromPhoneNumber = userTwilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSidToUse || !authTokenToUse || !fromPhoneNumber) {
    console.error(`[${timestamp}] Twilio credentials (SID, Token, or From Number) not fully configured. User specific SID used: ${!!userAccountSid}, Global SID used: ${!!process.env.TWILIO_ACCOUNT_SID}`);
    return NextResponse.json({ success: false, error: "Twilio configuration is missing on the server or for the user." }, { status: 500 });
  }

  twilioClient = twilio(accountSidToUse, authTokenToUse);
  console.log(`[${timestamp}] Sending SMS using Twilio config: ${userAccountSid ? 'User-Specific' : 'Global/System'}`);

  try {
    const message = await twilioClient.messages.create({
      to: to,
      from: fromPhoneNumber,
      body: body,
    });
    console.log(`[${timestamp}] SMS sent successfully. SID: ${message.sid} To: ${to}`);
    return NextResponse.json({ success: true, messageSid: message.sid, status: message.status });
  } catch (error: any) {
    console.error(`[${timestamp}] Error sending SMS via Twilio to ${to}:`, error);
    return NextResponse.json({ success: false, error: "Failed to send SMS.", details: error.message }, { status: 500 });
  }
}
