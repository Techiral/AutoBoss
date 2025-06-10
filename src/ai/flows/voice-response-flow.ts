
'use server';
/**
 * @fileOverview A Genkit flow for generating concise voice responses.
 *
 * - generateVoiceResponse - Generates a spoken response for a voice agent.
 * - VoiceResponseInput - Input schema for the flow.
 * - VoiceResponseOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { KnowledgeItem, AgentToneType } from '@/lib/types'; // For potential RAG light
import { AgentToneSchema } from '@/lib/types';

const VoiceResponseInputSchema = z.object({
  userInput: z.string().describe("The user's latest spoken input."),
  agentName: z.string().optional().describe("The name of the agent."),
  agentPersona: z.string().optional().describe("The persona of the agent."),
  agentRole: z.string().optional().describe("The role/objective of the agent."),
  agentTone: AgentToneSchema.optional().describe("The desired conversational tone for the agent."),
  shortHistory: z.array(z.string()).optional().describe("A very short history of the last few turns, e.g., ['User: Hello', 'Agent: Hi there! How can I help?']. Keep this brief for voice context."),
  knowledgeItems: z.array(z.custom<KnowledgeItem>()).optional().describe("Relevant knowledge items, if RAG is used lightly."),
});
export type VoiceResponseInput = z.infer<typeof VoiceResponseInputSchema>;

const VoiceResponseOutputSchema = z.object({
  agentResponse: z.string().describe('A concise and natural-sounding spoken response for the agent. Aim for brevity suitable for phone calls.'),
});
export type VoiceResponseOutput = z.infer<typeof VoiceResponseOutputSchema>;

export async function generateVoiceResponse(input: VoiceResponseInput): Promise<VoiceResponseOutput> {
  return voiceResponseFlow(input);
}

// Internal schema for the prompt, including boolean flags for tone
const PromptInputSchema = VoiceResponseInputSchema.extend({
  isFriendlyTone: z.boolean().optional(),
  isProfessionalTone: z.boolean().optional(),
  isWittyTone: z.boolean().optional(),
  isNeutralTone: z.boolean().optional(),
});

const voicePrompt = ai.definePrompt({
  name: 'voiceResponsePrompt',
  input: {schema: PromptInputSchema}, // Use extended schema
  output: {schema: VoiceResponseOutputSchema},
  prompt: `
{{#if agentTone}}
Your conversational tone MUST be: {{agentTone}}.
  {{#if isFriendlyTone}}
    Adopt a warm, approachable, and casual conversational style. Use friendly language and express positive emotions where appropriate.
  {{else if isProfessionalTone}}
    Maintain a formal, precise, and respectful tone. Use clear, direct language and avoid slang or overly casual expressions.
  {{else if isWittyTone}}
    Incorporate humor, clever wordplay, and a playful attitude. Responses can be lighthearted and engaging, but still relevant.
  {{else}}
    Use a balanced and neutral conversational style.
  {{/if}}
---
{{/if}}

You are {{agentName}}{{^agentName}}a helpful voice assistant{{/agentName}}.
{{#if agentPersona}}Your persona: {{agentPersona}}.{{/if}}
{{#if agentRole}}Your role: {{agentRole}}.{{/if}}

The user just said: "{{userInput}}"

{{#if shortHistory.length}}
Previous brief exchange:
{{#each shortHistory}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if knowledgeItems.length}}
You have the following information that might be relevant. Use it if it directly answers the user's query:
{{#each knowledgeItems}}
---
Source: {{this.fileName}}
Summary: {{this.summary}}
---
{{/each}}
{{/if}}

Respond to the user. Your response MUST be concise, natural-sounding, and suitable for a phone conversation. Avoid long paragraphs or complex sentences.
If your role is sales-oriented, try to gently guide the conversation towards understanding their needs and suggesting solutions if appropriate, but keep it very brief for voice.
Example: If user asks about pricing and you have pricing info, you could say "Our basic plan starts at $20 per month. Would you like more details on what's included?"
Do not explicitly say "Based on document X...". Just use the information naturally.

Your JSON output must contain only the "agentResponse" field.
`,
});

const voiceResponseFlow = ai.defineFlow(
  {
    name: 'voiceResponseFlow',
    inputSchema: VoiceResponseInputSchema, // Flow input is still the original schema
    outputSchema: VoiceResponseOutputSchema,
  },
  async (input: VoiceResponseInput): Promise<VoiceResponseOutput> => {
    // Prepare input for the prompt by adding boolean tone flags
    const promptInputData: z.infer<typeof PromptInputSchema> = {
      ...input,
      isFriendlyTone: input.agentTone === 'friendly',
      isProfessionalTone: input.agentTone === 'professional',
      isWittyTone: input.agentTone === 'witty',
      isNeutralTone: input.agentTone === 'neutral' || !input.agentTone,
    };

    const modelResponse = await voicePrompt(promptInputData);
    if (!modelResponse.output) {
      const rawText = modelResponse.response?.text;
      console.error("Voice response flow failed to produce structured output. Raw response:", rawText);
      // Fallback for voice
      return { agentResponse: "I'm sorry, I had a little trouble processing that. Could you say it again?" };
    }
    return modelResponse.output;
  }
);
