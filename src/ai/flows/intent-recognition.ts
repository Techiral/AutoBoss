// src/ai/flows/intent-recognition.ts
'use server';
/**
 * @fileOverview A flow for recognizing the intent of a user's input.
 *
 * - recognizeIntent - A function that analyzes user input and extracts intents and entities.
 * - RecognizeIntentInput - The input type for the recognizeIntent function.
 * - RecognizeIntentOutput - The return type for the recognizeIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeIntentInputSchema = z.object({
  userInput: z.string().describe('The user input to analyze.'),
});
export type RecognizeIntentInput = z.infer<typeof RecognizeIntentInputSchema>;

const RecognizeIntentOutputSchema = z.object({
  intent: z.string().describe('The intent of the user input.'),
  entities: z.record(z.string()).describe('The entities extracted from the user input.'),
});
export type RecognizeIntentOutput = z.infer<typeof RecognizeIntentOutputSchema>;

export async function recognizeIntent(input: RecognizeIntentInput): Promise<RecognizeIntentOutput> {
  return recognizeIntentFlow(input);
}

const recognizeIntentPrompt = ai.definePrompt({
  name: 'recognizeIntentPrompt',
  input: {schema: RecognizeIntentInputSchema},
  output: {schema: RecognizeIntentOutputSchema},
  prompt: `Analyze the following user input and extract the intent and entities.

User Input: {{{userInput}}}

Intent:
Entities:`, // The entities should be a key-value pair JSON.
});

const recognizeIntentFlow = ai.defineFlow(
  {
    name: 'recognizeIntentFlow',
    inputSchema: RecognizeIntentInputSchema,
    outputSchema: RecognizeIntentOutputSchema,
  },
  async input => {
    const {output} = await recognizeIntentPrompt(input);
    return output!;
  }
);
