
'use server';

/**
 * @fileOverview A autonomous reasoning AI agent with knowledge base access.
 *
 * - autonomousReasoning - A function that handles the autonomous reasoning process.
 * - AutonomousReasoningInput - The input type for the autonomousReasoning function.
 * - AutonomousReasoningOutput - The return type for the autonomousReasoning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { KnowledgeItemSchema } from '@/lib/types'; // Import KnowledgeItemSchema

const AutonomousReasoningInputSchema = z.object({
  context: z.string().describe('The current context of the conversation, including past messages.'),
  userInput: z.string().describe('The user input to analyze and respond to.'),
  knowledgeItems: z.array(KnowledgeItemSchema).optional().describe("An array of knowledge items for the agent."),
});
export type AutonomousReasoningInput = z.infer<typeof AutonomousReasoningInputSchema>;

const AutonomousReasoningOutputSchema = z.object({
  responseToUser: z.string().describe('A direct, conversational reply to the user based on the context, their input, and any provided knowledge.'),
  reasoning: z.string().describe('The reasoning behind the generated response.'),
});
export type AutonomousReasoningOutput = z.infer<typeof AutonomousReasoningOutputSchema>;

export async function autonomousReasoning(input: AutonomousReasoningInput): Promise<AutonomousReasoningOutput> {
  return autonomousReasoningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autonomousReasoningPrompt',
  input: {schema: AutonomousReasoningInputSchema},
  output: {schema: AutonomousReasoningOutputSchema},
  prompt: `You are a helpful and conversational AI assistant. Your primary goal is to understand the user's input within the given conversation context and respond naturally and effectively.

{{#if knowledgeItems}}
You have access to the following information from a knowledge base. Use it to answer questions or supplement your responses whenever relevant:
{{#each knowledgeItems}}
---
Source: {{{this.fileName}}}
Summary: {{{this.summary}}}
Keywords: {{#each this.keywords}}{{{this}}}{{/each}}
---
{{/each}}
Always prioritize information from this knowledge base if it directly answers the user's query.
{{else}}
You do not have any specific pre-loaded documents for this query, rely on your general knowledge and the conversation context.
{{/if}}

Conversation Context (previous messages):
{{{context}}}

User's Latest Input:
{{{userInput}}}

Based on the full conversation context, the user's latest input, and any relevant information from the knowledge base (if provided):
1. Generate a direct, natural, and conversational "responseToUser".
2. Provide a brief "reasoning" for why you chose that response. For instance, mention if you used the knowledge base or how the user's input related to the conversation history.

Your response MUST be a single, valid JSON object adhering to the output schema:
{
  "responseToUser": "The conversational reply to send to the user.",
  "reasoning": "The reasoning behind the chosen response."
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
    // The Handlebars prompt template handles the conditional inclusion of knowledgeItems directly.
    const modelResponse = await prompt(input); 
    
    if (!modelResponse.output) {
        const rawText = modelResponse.response?.text;
        console.error("Autonomous reasoning failed to produce structured output. Raw response:", rawText);
        throw new Error(`Autonomous reasoning failed. Model response: ${rawText ? rawText.substring(0,200) : 'No raw text'}`);
    }
    return modelResponse.output;
  }
);

