
'use server';

/**
 * @fileOverview A autonomous reasoning AI agent with knowledge base access, enhanced for RAG-like behavior.
 *
 * - autonomousReasoning - A function that handles the autonomous reasoning process.
 * - AutonomousReasoningInput - The input type for the autonomousReasoning function.
 * - AutonomousReasoningOutput - The return type for the autonomousReasoning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { KnowledgeItemSchema } from '@/lib/types'; // Import KnowledgeItemSchema

const AutonomousReasoningInputSchema = z.object({
  agentName: z.string().optional().describe("The name of the agent."),
  agentPersona: z.string().optional().describe("The persona of the agent."),
  agentRole: z.string().optional().describe("The role/objective of the agent."),
  context: z.string().describe('The current context of the conversation, including past messages.'),
  userInput: z.string().describe('The user input to analyze and respond to.'),
  knowledgeItems: z.array(KnowledgeItemSchema).optional().describe("An array of knowledge items for the agent."),
});
export type AutonomousReasoningInput = z.infer<typeof AutonomousReasoningInputSchema>;

const AutonomousReasoningOutputSchema = z.object({
  responseToUser: z.string().describe('A direct, conversational reply to the user. If knowledge was used, it cites the source (e.g., "Based on document X...").'),
  reasoning: z.string().describe('The reasoning behind the generated response, including which knowledge items were deemed relevant and used.'),
  relevantKnowledgeIds: z.array(z.string()).optional().describe('IDs of the knowledge items deemed most relevant and used for the response.')
});
export type AutonomousReasoningOutput = z.infer<typeof AutonomousReasoningOutputSchema>;

export async function autonomousReasoning(input: AutonomousReasoningInput): Promise<AutonomousReasoningOutput> {
  return autonomousReasoningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autonomousReasoningPrompt',
  input: {schema: AutonomousReasoningInputSchema},
  output: {schema: AutonomousReasoningOutputSchema},
  prompt: `
{{#if agentName}}You are {{agentName}}.{{/if}}
{{#if agentPersona}} Your persona is: {{agentPersona}}.{{/if}}
{{#if agentRole}} Your role is: {{agentRole}}.{{else}}You are a helpful and conversational AI assistant.{{/if}}
Your goal is to understand the user's input within the given conversation context and respond effectively.

You will follow a RAG-like (Retrieval Augmented Generation) process if knowledge items are provided:
1.  **Analyze and Retrieve:** First, carefully analyze the "User's Latest Input" and the "Conversation Context".
2.  **Assess Knowledge Relevancy:**
    {{#if knowledgeItems}}
    Review the following "Available Knowledge Items". For each item, determine if it is highly relevant to the user's current query.
    --- AVAILABLE KNOWLEDGE ITEMS START ---
    {{#each knowledgeItems}}
    Item ID: {{{this.id}}}
    Source: {{{this.fileName}}}
    Summary: {{{this.summary}}}
    Keywords: {{#each this.keywords}}{{{this}}}{{/each}}
    ---
    {{/each}}
    --- AVAILABLE KNOWLEDGE ITEMS END ---
    Identify the IDs of the most relevant knowledge items (if any) and list them in the "relevantKnowledgeIds" output field.
    {{else}}
    No specific knowledge items are available for this query. Rely on your general knowledge and the conversation context. Set "relevantKnowledgeIds" to an empty array or omit it.
    {{/if}}
3.  **Generate Response:**
    *   If relevant knowledge items were identified, synthesize information *primarily* from these items to construct your "responseToUser".
    *   If you use information from the knowledge base, explicitly cite the source document name in your response (e.g., "Based on the document '{{{this.fileName}}}', ...").
    *   If no relevant knowledge items were found or no knowledge items were provided, use your general knowledge and the conversation context to answer.
4.  **Explain Reasoning:** Provide a brief "reasoning" for why you chose that response. If knowledge items were used, explain which ones were relevant and how they helped. If no knowledge was used, explain why (e.g., "General knowledge question" or "No relevant documents found").

Conversation Context (previous messages):
{{{context}}}

User's Latest Input:
{{{userInput}}}

Your response MUST be a single, valid JSON object adhering to the output schema:
{
  "responseToUser": "The conversational reply. Cite sources like '[Source: file.txt]' if knowledge was used.",
  "reasoning": "Explanation of how the response was derived, noting any specific knowledge items used.",
  "relevantKnowledgeIds": ["id_of_relevant_item_1", "id_of_relevant_item_2"]
}
`,
});

const autonomousReasoningFlow = ai.defineFlow(
  {
    name: 'autonomousReasoningFlow',
    inputSchema: AutonomousReasoningInputSchema,
    outputSchema: AutonomousReasoningOutputSchema,
  },
  async (input: AutonomousReasoningInput): Promise<AutonomousReasoningOutput> => {
    const modelResponse = await prompt(input); 
    
    if (!modelResponse.output) {
        const rawText = modelResponse.response?.text;
        console.error("Autonomous reasoning failed to produce structured output. Raw response:", rawText);
        if (rawText) {
            try {
                const parsedOutput = JSON.parse(rawText);
                if (AutonomousReasoningOutputSchema.safeParse(parsedOutput).success) {
                     console.warn("Autonomous reasoning successfully parsed raw text fallback.");
                    return parsedOutput as AutonomousReasoningOutput;
                }
            } catch (e) {
                 // Ignore if parsing fails, proceed to throw original error
            }
        }
        throw new Error(`Autonomous reasoning failed. Model response: ${rawText ? rawText.substring(0,200) : 'No raw text'}`);
    }
    return modelResponse.output;
  }
);
