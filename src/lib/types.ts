
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
  jinaApiKey: z.string().optional().nullable().describe("User's Jina AI Reader API Key for web scraping."),
  ttsCreditsUsed: z.number().optional().describe("Counter for free tier usage of the system's TTS key."),
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
export const JobIdSchema = z.enum(["website_support", "website_lead_gen", "inbound_call_answering", "outbound_sales_calls", "custom"]);
export type JobId = z.infer<typeof JobIdSchema>;

export type AgentType = 'chat' | 'voice' | 'hybrid';
export type AgentLogicType = 'prompt' | 'rag';
export type AgentDirection = 'inbound' | 'outbound';
export const AgentToneSchema = z.enum(["neutral", "friendly", "professional", "witty"]);
export type AgentToneType = z.infer<typeof AgentToneSchema>;

// Input schema for the new agent creation flow
export const CreateAgentFromPromptInputSchema = z.object({
  prompt: z
    .string()
    .describe('The user\'s natural language request for the agent to be built.'),
  existingClientNames: z.array(z.string()).optional().describe('A list of client names that already exist for this user, to help the AI match or create a new one.'),
  isPubliclyShared: z.boolean().optional().describe('Whether the user has indicated this agent should be public.'),
  hasKnowledge: z.boolean().optional().describe('Whether the user has attached a knowledge source (file, text, or URL).'),
});
export type CreateAgentFromPromptInput = z.infer<typeof CreateAgentFromPromptInputSchema>;


// Output schema for the new agent creation flow
export const AgentCreationOutputSchema = z.object({
  name: z.string().describe("A short, internal-facing name for the agent concept (e.g., 'ACME Support Bot'). This is derived from the prompt."),
  description: z.string().describe("A one-sentence description of the agent's purpose."),
  role: z.string().describe("A detailed description of the agent's role and objectives, written in the first person as if the agent is describing its job."),
  personality: z.string().describe("A detailed description of the agent's personality and communication style."),
  generatedName: z.string().describe('A creative, catchy, user-facing name for the agent.'),
  generatedPersona: z
    .string()
    .describe('A detailed persona of the agent based on the description, written in the first person.'),
  generatedGreeting: z.string().describe('A sample greeting from the agent that aligns with its persona and role.'),
  agentType: z.custom<AgentType>().describe("The type of agent: 'chat', 'voice', or 'hybrid'. Inferred from the prompt (e.g., 'chatbot' -> chat, 'answers the phone' -> voice)."),
  direction: z.custom<AgentDirection>().optional().describe("The direction of the agent: 'inbound' or 'outbound'. Inferred from the prompt (e.g., 'answers calls' -> inbound). Default to 'inbound' if unsure."),
  agentTone: AgentToneSchema.describe("The desired conversational tone for the agent (e.g., 'friendly', 'professional'). Inferred from the prompt."),
  primaryLogic: z.custom<AgentLogicType>().describe("The core logic for the agent. If the prompt implies answering questions from specific info OR if 'hasKnowledge' is true, this MUST be 'rag'. Otherwise, it should be 'prompt' for general conversation."),
  isPubliclyShared: z.boolean().describe("Whether the agent should be publicly listed."),
  clientName: z.string().optional().describe("The name of the client this agent is for. If the prompt mentions a name that matches one from 'existingClientNames', use that exact name. If it mentions a new company name, use that new name. If no client or company is mentioned, this field should be omitted."),
});
export type AgentCreationOutput = z.infer<typeof AgentCreationOutputSchema>;


export const AgentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientId: z.string(),
  clientName: z.string().optional(), // Denormalized for convenience
  jobId: JobIdSchema.optional(), // The primary "Job to be Done"
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
  agentImageUrl: z.string().optional().nullable().describe("Data URI for the agent's branding image for social sharing."),
  ogDescription: z.string().max(300, "OG description should be 300 characters or less.").optional().nullable().describe("Custom description for social media sharing."),
  voiceName: z.string().optional().nullable().describe("The pre-built voice name from the TTS provider."),
  isPubliclyShared: z.boolean().optional().default(false),
  sharedAt: z.custom<Timestamp>().optional().nullable(),
  showcaseMetrics: z.object({
    queriesHandled: z.number().optional(),
    customMetricLabel: z.string().optional(),
    customMetricValue: z.string().optional(),
  }).optional(),
  analytics: z.object({
    totalConversations: z.number().optional(),
    totalMessages: z.number().optional(),
  }).optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

// Conversation History & Analytics Types
export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(['user', 'agent']),
  text: z.string(),
  timestamp: z.number(),
  reasoning: z.string().optional(),
  relevantKnowledgeIds: z.array(z.string()).optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  userId: z.string(), // This is the agent owner's ID
  createdAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
  status: z.enum(['ongoing', 'resolved', 'failed']),
  messages: z.array(ChatMessageSchema),
  messageCount: z.number().optional(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

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

// For Text-to-Speech Flow
export const GenerateSpeechInputSchema = z.object({
  text: z.string().min(1, 'Text to speak cannot be empty.'),
  voiceName: z.string().optional().nullable().describe("The pre-built voice name from the TTS provider. Falls back to a default if not provided."),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

export const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().describe('A public URL or Data URI to the generated audio file.'),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;
