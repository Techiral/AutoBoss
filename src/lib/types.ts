
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

// Zod Schema for UserProfile (stored in Firestore 'users' collection)
export const UserProfileSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoDataUri: z.string().optional().describe("Base64 encoded Data URI for profile photo."),
  phoneNumber: z.string().optional().describe("User's phone number, potentially for voice agent features or account recovery."),
  createdAt: z.custom<Timestamp>(),
  sendGridApiKey: z.string().optional().nullable().describe("User's own SendGrid API Key."),
  userDefaultFromEmail: z.string().email().optional().nullable().describe("User's default 'From' email for SendGrid."),
  twilioAccountSid: z.string().optional().nullable().describe("User's Twilio Account SID."),
  twilioAuthToken: z.string().optional().nullable().describe("User's Twilio Auth Token."),
  twilioPhoneNumber: z.string().optional().nullable().describe("User's default Twilio Phone Number for sending SMS/making calls."),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;


// Zod Schema for KnowledgeItem
export const KnowledgeItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  uploadedAt: z.string().or(z.custom<Timestamp>()),
  summary: z.string().optional().describe("For CSVs, this will store the full structured text. For other docs, it's an AI-generated summary."),
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
  isPreStructuredText: z.boolean().optional().describe("Hint to the AI that the documentDataUri contains pre-structured text (e.g., from a CSV) and the 'summary' output should be this text verbatim."),
});
export type KnowledgeExtractionInput = z.infer<typeof KnowledgeExtractionInputSchema>;

// Zod Schema for KnowledgeExtractionOutput
export const KnowledgeExtractionOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key information extracted from the document. For pre-structured text (like CSVs), this will be the original structured text itself.'),
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

// Client related types
export const ClientSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Client name cannot be empty."),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500, "Description too long").optional().or(z.literal("")),
  createdAt: z.custom<Timestamp>(),
});
export type Client = z.infer<typeof ClientSchema>;


// Agent related types
export type AgentType = 'chat' | 'voice' | 'hybrid';
export type AgentLogicType = 'prompt' | 'rag';
export type AgentDirection = 'inbound' | 'outbound';
export const AgentToneSchema = z.enum(["neutral", "friendly", "professional", "witty"]);
export type AgentToneType = z.infer<typeof AgentToneSchema>;
export type AgentPurposeType = "support" | "sales" | "info" | "custom";


export const AgentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientId: z.string(),
  clientName: z.string().optional(), // Denormalized for convenience
  agentType: z.custom<AgentType>(),
  primaryLogic: z.custom<AgentLogicType>().optional(),
  direction: z.custom<AgentDirection>().optional(),
  agentTone: AgentToneSchema.optional(),
  name: z.string(), // Client/Business Name or Agent Concept from original form
  description: z.string(), // Auto-generated or user-refined based on inputs
  role: z.string().optional(), // Detailed role & objectives
  personality: z.string().optional(), // Personality & tone clues
  agentPurpose: z.custom<AgentPurposeType>().optional(), // User-selected primary purpose
  generatedName: z.string().optional(),
  generatedPersona: z.string().optional(),
  generatedGreeting: z.string().optional(),
  createdAt: z.custom<Timestamp>(), // Will be converted to string in app state
  knowledgeItems: z.array(KnowledgeItemSchema).optional(),
  agentImageDataUri: z.string().optional().describe("Base64 Data URI for the agent's branding image. Keep very small!"),
  ogDescription: z.string().max(300, "OG description should be 300 characters or less.").optional().describe("Custom description for social media sharing."),
});
export type Agent = z.infer<typeof AgentSchema>;


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

