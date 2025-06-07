
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
  prompt: `You are an AI assistant. Your role is to analyze the context of a conversation, the user's input, and any provided knowledge to generate a helpful and relevant response.

{{#if knowledgeItems.length}}
Relevant Information from Knowledge Base:
{{#each knowledgeItems}}
---
Summary: {{{this.summary}}}
Keywords: {{#each this.keywords}}{{{this}}}{{/each}}
---
{{/each}}

Based on this knowledge AND the conversation context, proceed with the user's request.
{{/if}}

Conversation Context:
{{{context}}}

User's Latest Input:
{{{userInput}}}

Based on the full conversation context, the user's latest input, and any relevant information from the knowledge base (if provided), generate a direct conversational "responseToUser". Also, provide a brief "reasoning" for why you chose that response.

Output in JSON format:
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
    // Prepare knowledge string for the prompt, similar to executeAgentFlow
    let knowledgeContent = "";
    if (input.knowledgeItems && input.knowledgeItems.length > 0) {
      const knowledgeSummaries = input.knowledgeItems
        .map(item => item.summary)
        .filter(Boolean)
        .join("\n\n---\n\n");
      if (knowledgeSummaries) {
        knowledgeContent = `Relevant Information from Knowledge Base:\n${knowledgeSummaries}\n\n`;
      }
    }
    
    // The Handlebars prompt template handles the conditional inclusion of knowledgeItems
    // directly from the input object. We don't need to manually construct the prompt string here.
    // The `prompt` function defined by `ai.definePrompt` will use the `knowledgeItems` from the input object.

    const {output} = await prompt(input); // Pass the full input including knowledgeItems
    
    if (!output) {
        throw new Error("Autonomous reasoning failed to produce an output.");
    }
    return output;
  }
);

