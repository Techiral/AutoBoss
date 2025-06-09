
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

// Zod Schema for UserProfile (stored in Firestore 'users' collection)
export const UserProfileSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoDataUri: z.string().optional().describe("Base64 encoded Data URI for profile photo."),
  phoneNumber: z.string().optional().describe("User's phone number, potentially for voice agent features or account recovery."),
  createdAt: z.custom<Timestamp>(),
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


// Zod Schemas for Flow Definition
export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    'start',
    'sendMessage',
    'getUserInput',
    'callLLM', // "Ask AI / Smart Response"
    'condition', // "Make a Decision"
    'qnaLookup', // "Answer from Knowledge"
    'wait', // "Add Delay"
    'end'
  ]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),

  // Common properties
  label: z.string().optional(),

  // sendMessage
  message: z.string().optional(),

  // getUserInput
  prompt: z.string().optional(), // Question for the user
  variableName: z.string().optional(), // Variable to store user's answer
  inputType: z.string().optional().describe("e.g., text, number, email - for future validation hints"),
  validationRules: z.string().optional().describe("e.g., regex for email - for future validation"),

  // callLLM ("Ask AI / Smart Response")
  llmPrompt: z.string().optional().describe("Instructions for the AI. Use {{variable}} for context."),
  outputVariable: z.string().optional().describe("Variable to store AI's response."),
  useKnowledge: z.boolean().optional().describe("Allow AI to use trained knowledge."),
  
  // condition ("Make a Decision")
  conditionVariable: z.string().optional().describe("Variable from context to base the decision on."),
  useLLMForDecision: z.boolean().optional().describe("If true, AI tries to match variable value to edge conditions."),

  // qnaLookup ("Answer from Knowledge")
  qnaQueryVariable: z.string().optional().describe("Context variable holding the user's query."),
  qnaOutputVariable: z.string().optional().describe("Context variable to store the found answer."),
  qnaFallbackText: z.string().optional().describe("Text to show if no answer is found in knowledge."),
  
  // wait ("Add Delay")
  waitDurationMs: z.number().optional().default(1000),

  // end
  endOutputVariable: z.string().optional().describe("Variable from context to output when flow ends (advanced)."),

  // Kept for potential future light use if simplified or specific to a node
  agentContextWindow: z.number().optional(), 
});
export type FlowNode = z.infer<typeof FlowNodeSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  condition: z.string().optional().describe("For 'condition' nodes, this is the value the conditionVariable is checked against."),
  edgeType: z.enum(['default', 'success', 'error', 'invalid', 'found', 'notFound']).optional().default('default').describe("Semantic type for edge logic (e.g., for Q&A found/not found paths).")
});
export type FlowEdge = z.infer<typeof FlowEdgeSchema>;

export const AgentFlowDefinitionSchema = z.object({
  flowId: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
});
export type AgentFlowDefinition = z.infer<typeof AgentFlowDefinitionSchema>;

export const FlowContextSchema = z.record(z.any()).describe("Holds variables like userName, llmResponse etc. Also includes conversationHistory and potentially other dynamic state such as 'currentNodeId' and 'waitingForInput'.");
export type FlowContext = z.infer<typeof FlowContextSchema>;

// Agent interface
export type AgentType = 'chat' | 'voice' | 'hybrid';
export type AgentLogicType = 'flow' | 'prompt' | 'rag' | 'hybrid';
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
  flow?: AgentFlowDefinition;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
  intent?: string;
  entities?: Record<string, string>;
  reasoning?: string;
  flowNodeId?: string;
  flowContext?: FlowContext;
  relevantKnowledgeIds?: string[];
}
