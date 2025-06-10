
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { z } from 'zod';
import { db } from '@/lib/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import type { Agent, UserProfile } from '@/lib/types';

const EmailRequestBodySchema = z.object({
  to: z.string().email("Invalid recipient email address."),
  subject: z.string().min(1, "Email subject cannot be empty."),
  text: z.string().min(1, "Email text body cannot be empty."),
  html: z.string().optional().describe("HTML content for the email."),
  fromEmail: z.string().email("Invalid sender email address.").optional(),
  agentId: z.string().optional().describe("ID of the agent initiating or related to this email, for fetching user-specific config."),
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

  const { to, subject, text, html, fromEmail: payloadFromEmail, agentId } = requestBody;

  let userSendGridApiKey: string | null = null;
  let userDefaultFromEmailAddress: string | null = null;

  if (agentId) {
    try {
      console.log(`[${timestamp}] Agent ID provided: ${agentId}. Attempting to fetch agent and user profile for SendGrid config.`);
      const agentRef = doc(db, 'agents', agentId);
      const agentSnap = await getDoc(agentRef);
      if (agentSnap.exists()) {
        const agentData = agentSnap.data() as Agent;
        if (agentData.userId) {
          const userRef = doc(db, 'users', agentData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userProfile = userSnap.data() as UserProfile;
            userSendGridApiKey = userProfile.sendGridApiKey || null;
            userDefaultFromEmailAddress = userProfile.userDefaultFromEmail || null;
            if (userSendGridApiKey) {
              console.log(`[${timestamp}] Using SendGrid API key from user profile: ${agentData.userId}`);
            }
             if (userDefaultFromEmailAddress) {
              console.log(`[${timestamp}] User default 'From' email found: ${userDefaultFromEmailAddress}`);
            }
          } else {
             console.warn(`[${timestamp}] User profile not found for userId: ${agentData.userId} (from agent ${agentId})`);
          }
        } else {
           console.warn(`[${timestamp}] Agent ${agentId} does not have a userId.`);
        }
      } else {
         console.warn(`[${timestamp}] Agent ${agentId} not found.`);
      }
    } catch (dbError) {
      console.error(`[${timestamp}] Error fetching user-specific SendGrid config from Firestore:`, dbError);
      // Continue with global config if this fails
    }
  }

  const apiKeyToUse = userSendGridApiKey || process.env.SENDGRID_API_KEY;
  const globalDefaultSenderEmail = process.env.DEFAULT_SENDER_EMAIL;

  if (!apiKeyToUse) {
    console.error(`[${timestamp}] SendGrid API key is not configured (neither user-specific nor global).`);
    return NextResponse.json({ success: false, error: "SendGrid API key is not configured on the server." }, { status: 500 });
  }
  sgMail.setApiKey(apiKeyToUse);

  const finalFromEmail = payloadFromEmail || userDefaultFromEmailAddress || globalDefaultSenderEmail;

  if (!finalFromEmail) {
    console.error(`[${timestamp}] Sender email not configured (neither in payload, user profile, nor global default).`);
    return NextResponse.json({ success: false, error: "Sender email address is not configured." }, { status: 500 });
  }

  const msg = {
    to: to,
    from: finalFromEmail,
    subject: subject,
    text: text,
    html: html || text, 
  };

  console.log(`[${timestamp}] Sending email via SendGrid. To: ${to}, From: ${finalFromEmail}, Subject: ${subject.substring(0,30)}... Using API Key source: ${userSendGridApiKey ? 'User Profile' : 'Global Env'}`);

  try {
    const [response] = await sgMail.send(msg);
    console.log(`[${timestamp}] Email sent successfully to ${to}. Status Code: ${response.statusCode}, Message ID: ${response.headers['x-message-id']}`);
    return NextResponse.json({ success: true, messageId: response.headers['x-message-id'], details: `Email sent to ${to}` });
  } catch (error: any) {
    console.error(`[${timestamp}] Error sending email via SendGrid to ${to}:`, error.response?.body || error.message);
    return NextResponse.json({ success: false, error: "Failed to send email.", details: error.response?.body?.errors || error.message }, { status: 500 });
  }
}

