
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { z } from 'zod';

const SmsRequestBodySchema = z.object({
  to: z.string().min(10, "Recipient phone number is required and seems too short."), // Basic validation
  body: z.string().min(1, "Message body cannot be empty."),
  // agentId: z.string().optional(), // Could be used for logging or agent-specific sender IDs in future
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

  const { to, body } = requestBody;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error(`[${timestamp}] Twilio environment variables not set.`);
    return NextResponse.json({ success: false, error: "Twilio configuration is missing on the server." }, { status: 500 });
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      to: to,
      from: twilioPhoneNumber,
      body: body,
    });
    console.log(`[${timestamp}] SMS sent successfully. SID: ${message.sid} To: ${to}`);
    return NextResponse.json({ success: true, messageSid: message.sid, status: message.status });
  } catch (error: any) {
    console.error(`[${timestamp}] Error sending SMS via Twilio to ${to}:`, error);
    return NextResponse.json({ success: false, error: "Failed to send SMS.", details: error.message }, { status: 500 });
  }
}
