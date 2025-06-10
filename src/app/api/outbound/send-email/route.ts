
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { z } from 'zod';

const EmailRequestBodySchema = z.object({
  to: z.string().email("Invalid recipient email address."),
  subject: z.string().min(1, "Email subject cannot be empty."),
  text: z.string().min(1, "Email text body cannot be empty."),
  html: z.string().optional().describe("HTML content for the email."),
  fromEmail: z.string().email("Invalid sender email address.").optional(),
  // agentId: z.string().optional(), // For logging or agent-specific configurations
});

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Received request for /api/outbound/send-email`);

  let requestBody;
  try {
    requestBody = EmailRequestBodySchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[${timestamp}] Validation Error:`, error.errors);
      return NextResponse.json({ success: false, error: "Invalid request body.", details: error.errors }, { status: 400 });
    }
    console.error(`[${timestamp}] Error parsing JSON:`, error);
    return NextResponse.json({ success: false, error: "Malformed JSON in request body." }, { status: 400 });
  }

  const { to, subject, text, html, fromEmail } = requestBody;

  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const defaultSenderEmail = process.env.DEFAULT_SENDER_EMAIL;

  if (!sendGridApiKey) {
    console.error(`[${timestamp}] SendGrid API key not set.`);
    return NextResponse.json({ success: false, error: "SendGrid configuration is missing on the server." }, { status: 500 });
  }

  sgMail.setApiKey(sendGridApiKey);

  const sender = fromEmail || defaultSenderEmail;
  if (!sender) {
    console.error(`[${timestamp}] Sender email not configured (neither fromEmail in payload nor DEFAULT_SENDER_EMAIL in env).`);
    return NextResponse.json({ success: false, error: "Sender email address is not configured." }, { status: 500 });
  }

  const msg = {
    to: to,
    from: sender,
    subject: subject,
    text: text,
    html: html || text, // Use text as HTML if HTML not provided
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(`[${timestamp}] Email sent successfully to ${to}. Status Code: ${response.statusCode}`);
    // SendGrid v3 API returns an array with the response, typically the first element.
    // response.headers['x-message-id'] can be useful for tracking.
    return NextResponse.json({ success: true, messageId: response.headers['x-message-id'], details: `Email sent to ${to}` });
  } catch (error: any) {
    console.error(`[${timestamp}] Error sending email via SendGrid to ${to}:`, error.response?.body || error.message);
    return NextResponse.json({ success: false, error: "Failed to send email.", details: error.response?.body?.errors || error.message }, { status: 500 });
  }
}
