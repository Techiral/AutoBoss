
import { z } from 'zod';

// Zod Schema for KnowledgeItem
export const KnowledgeItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  uploadedAt: z.string(), // ISO date string
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


// Zod Schemas for Flow Definition
export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    'start', 
    'sendMessage', 
    'getUserInput', 
    'callLLM', 
    'condition', 
    'apiCall', // Used for HTTP Request
    'end',
    'action',      // New
    'code',        // New
    'qnaLookup',   // New
    'wait',        // New
    'transition',  // New
    'agentSkill'   // New
  ]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  
  // sendMessage
  message: z.string().optional(),
  
  // getUserInput (Ask Question)
  prompt: z.string().optional(), 
  variableName: z.string().optional(), 
  inputType: z.string().optional().describe("e.g., text, number, email, choice, date"),
  validationRules: z.string().optional().describe("e.g., regex, ranges"),

  // callLLM
  llmPrompt: z.string().optional(), 
  outputVariable: z.string().optional(), 
  useKnowledge: z.boolean().optional(),
  
  // condition
  conditionVariable: z.string().optional(), 
  useLLMForDecision: z.boolean().optional().describe("If true, uses an LLM to match conditionVariable's value against edge conditions."),
  conditionExpressions: z.array(z.string()).optional().describe("List of JS/Nunjucks expressions for condition node (currently not used if useLLMForDecision is true)"),


  // apiCall (HTTP Request)
  apiUrl: z.string().optional(),
  apiMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().default('GET'), 
  apiHeaders: z.record(z.string()).or(z.string()).optional().describe("e.g. {\"Authorization\": \"Bearer {{token}}\", \"Content-Type\": \"application/json\"}"),
  apiBodyVariable: z.string().optional().describe("Variable from context for request body (e.g. if POST/PUT)"),
  apiTimeout: z.number().optional().default(10000),
  apiRetryAttempts: z.number().optional().default(0),
  apiOutputVariable: z.string().optional().describe("Variable to store the API response text/JSON string"), 

  // end
  endOutputVariable: z.string().optional().describe("Variable from context to output from the flow"),

  // action
  actionName: z.string().optional(),
  actionInputArgs: z.record(z.any()).or(z.string()).optional().describe("Key-value pairs for action inputs, e.g. {\"userId\": \"{{userIdVar}}\", \"product\": \"Laptop\"}"), // JSON string or direct object
  actionOutputVarMap: z.record(z.string()).or(z.string()).optional().describe("Map action's output fields to context variables, e.g. {\"contextVar\": \"actionOutputField\"}"),

  // code
  codeScript: z.string().optional().describe("JavaScript snippet. Warning: Direct execution is unsafe. Use with extreme caution and sandboxing."),
  codeReturnVarMap: z.record(z.string()).or(z.string()).optional().describe("Map returned object keys to context variables, e.g. {\"contextVar\": \"returnedKey\"}"),

  // qnaLookup
  qnaKnowledgeBaseId: z.string().optional().describe("ID of the knowledge base to search (conceptual)."),
  qnaQueryVariable: z.string().optional().describe("Context variable holding the user's query for Q&A lookup (replaces conditionVariable for this node type)."),
  qnaThreshold: z.number().optional().default(0.7),
  qnaOutputVariable: z.string().optional().describe("Context variable to store the found Q&A answer text."),
  qnaFallbackText: z.string().optional().describe("Fallback text if Q&A lookup finds no answer."),

  // wait
  waitDurationMs: z.number().optional().default(1000),

  // transition
  transitionTargetFlowId: z.string().optional(),
  transitionTargetNodeId: z.string().optional(),
  transitionVariablesToPass: z.record(z.any()).or(z.string()).optional().describe("Key-value pairs of variables to pass to the new flow's context"), // JSON string or direct object

  // agentSkill
  agentSkillId: z.string().optional(),
  agentSkillsList: z.array(z.string()).optional(),
  agentContextWindow: z.number().optional(),
  
  // Default label property, used by Studio if node.label is not explicitly set
  label: z.string().optional(), 

});
export type FlowNode = z.infer<typeof FlowNodeSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(), // source node id
  target: z.string(), // target node id
  label: z.string().optional(), // Visual label for the edge (e.g., for conditions or error paths)
  condition: z.string().optional(), // Value for conditional branching or descriptive category for LLM. Empty/absent for default/unconditional.
  edgeType: z.enum(['default', 'success', 'error', 'invalid', 'found', 'notFound']).optional().default('default').describe("Semantic type for edge, e.g. for HTTP error paths or Q&A results")
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

// Zod Schema for Flow Context
export const FlowContextSchema = z.record(z.any()).describe("Holds variables like userName, llmResponse etc. Also includes conversationHistory and potentially other dynamic state.");
export type FlowContext = z.infer<typeof FlowContextSchema>;


// Existing Agent and other types
export interface Agent {
  id: string;
  name: string;
  description: string; // User-provided description
  role?: string; // User-provided role for creation
  personality?: string; // User-provided personality for creation
  generatedName?: string; // Name generated by AI
  generatedPersona?: string; // Persona generated by AI
  generatedGreeting?: string; // Greeting generated by AI
  createdAt: string;
  knowledgeItems?: KnowledgeItem[]; // Uses the Zod-inferred type
  flow?: AgentFlowDefinition; // Each agent can have one flow
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
  intent?: string;
  entities?: Record<string, string>;
  reasoning?: string; // From autonomous reasoning
  flowNodeId?: string; // ID of the flow node that generated this message
  flowContext?: FlowContext; // Context at the time of this message (for debugging or state)
}
