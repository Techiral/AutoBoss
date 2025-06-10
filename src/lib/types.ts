
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

// Zod Schema for UserProfile (stored in Firestore 'users' collection)
export const UserProfileSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoDataUri: z.string().optional().describe("Base64 encoded Data URI for profile photo."),
  phoneNumber: z.string().optional().describe("User's phone number, potentially for voice agent features or account recovery."),
  createdAt: z.custom<Timestamp>(),
  sendGridApiKey: z.string().optional().describe("User's own SendGrid API Key."),
  userDefaultFromEmail: z.string().email().optional().describe("User's default 'From' email for SendGrid."),
  twilioAccountSid: z.string().optional().describe("User's Twilio Account SID."),
  twilioAuthToken: z.string().optional().describe("User's Twilio Auth Token."),
  twilioPhoneNumber: z.string().optional().describe("User's default Twilio Phone Number for sending SMS/making calls."),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;


// Zod Schema for KnowledgeItem
export const KnowledgeItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  uploadedAt: z.string().or(z.custom<Timestamp>()),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

// Zod Schema for KnowledgeExtractionInput
export const KnowledgeExtractionInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      'The document to extract knowledge from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type KnowledgeExtractionInput = z.infer<typeof KnowledgeExtractionInputSchema>;

// Zod Schema for KnowledgeExtractionOutput
export const KnowledgeExtractionOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key information extracted from the document.'),
  keywords: z
    .array(z.string())
    .describe('A list of keywords that represent the main topics covered in the document.'),
});
export type KnowledgeExtractionOutput = z.infer<typeof KnowledgeExtractionOutputSchema>;

// Zod Schema for ProcessedUrlOutput
export const ProcessedUrlOutputSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  extractedText: z.string(),
});
export type ProcessedUrlOutput = z.infer<typeof ProcessedUrlOutputSchema>;

// Agent interface
export type AgentType = 'chat' | 'voice' | 'hybrid';
export type AgentLogicType = 'prompt' | 'rag';
export type AgentDirection = 'inbound' | 'outbound';

export interface Agent {
  id: string;
  userId: string;
  agentType: AgentType;
  primaryLogic?: AgentLogicType;
  direction?: AgentDirection;
  name: string;
  description: string;
  role?: string;
  personality?: string;
  generatedName?: string;
  generatedPersona?: string;
  generatedGreeting?: string;
  createdAt: string | Timestamp;
  knowledgeItems?: KnowledgeItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
  intent?: string;
  entities?: Record<string, string>;
  reasoning?: string;
  relevantKnowledgeIds?: string[];
  conversationHistory?: string[];
}


// For Outbound Enqueue API
export const OutboundTaskPayloadSchema = z.object({
  type: z.enum(["sms", "email", "call"]),
  to: z.string().min(1, "Recipient identifier is required."),
  agentId: z.string().min(1, "Agent ID is required for context."),
  payload: z.object({
    // SMS specific
    body: z.string().optional(),
    // Email specific
    fromEmail: z.string().email().optional(),
    subject: z.string().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
  }).passthrough(), // Allows other properties if needed for specific types
  scheduledAt: z.string().datetime({ offset: true }).optional().describe("Optional ISO 8601 timestamp for scheduled sending."),
});
export type OutboundTaskPayload = z.infer<typeof OutboundTaskPayloadSchema>;
    
