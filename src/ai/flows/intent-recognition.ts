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

// Schema for the input to the flow/prompt
const RecognizeIntentInputSchema = z.object({
  userInput: z.string().describe('The user input to analyze.'),
});
export type RecognizeIntentInput = z.infer<typeof RecognizeIntentInputSchema>;

// Schema for the *final output* of the flow (publicly exported type)
// This defines 'entities' as a structured object.
const FinalRecognizeIntentOutputSchema = z.object({
  intent: z.string().describe('The intent of the user input.'),
  entities: z.record(z.string()).describe('The entities extracted from the user input as an object.'),
});
export type RecognizeIntentOutput = z.infer<typeof FinalRecognizeIntentOutputSchema>;


// Schema for the *direct output from the LLM prompt*
// This is internal to this module. 'entitiesData' field is a JSON string here to comply with API requirements.
const PromptLLMOutputSchema = z.object({
  intent: z.string().describe('The intent of the user input.'),
  entitiesData: z.string().describe('A JSON string representing the extracted entities as key-value pairs (e.g., "{\\"location\\": \\"Paris\\", \\"item\\": \\"book\\"}"). If no entities are found, this should be an empty JSON object string like "{}."'),
});

// The exported function remains the same signature, returning the final structured output.
export async function recognizeIntent(input: RecognizeIntentInput): Promise<RecognizeIntentOutput> {
  return recognizeIntentFlow(input);
}

const recognizeIntentPrompt = ai.definePrompt({
  name: 'recognizeIntentPrompt',
  input: {schema: RecognizeIntentInputSchema},
  output: {schema: PromptLLMOutputSchema}, // LLM is instructed to output entities as a JSON string.
  prompt: `Analyze the following user input to determine the user's intent and extract relevant entities.

User Input: {{{userInput}}}

Please format your response as a single JSON object with exactly two keys: "intent" (a string for the user's main goal) and "entitiesData" (a JSON string for extracted entities).
For the "entitiesData" field, provide a JSON string where keys are entity types (e.g., "location", "date", "item") and values are the corresponding extracted text from the user input.

Example: If the user input is "Find a recipe for pasta carbonara for tonight", your response might look like:
{
  "intent": "find_recipe",
  "entitiesData": "{\\"dish_name\\": \\"pasta carbonara\\", \\"timeframe\\": \\"tonight\\"}"
}

If no specific entities are found in the input, "entitiesData" should be a JSON string representing an empty object, like "{}".
Ensure the entire response is a valid JSON object adhering to this structure.
`,
});

const recognizeIntentFlow = ai.defineFlow(
  {
    name: 'recognizeIntentFlow',
    inputSchema: RecognizeIntentInputSchema,
    outputSchema: FinalRecognizeIntentOutputSchema, // Flow's final output has 'entities' as a parsed object.
  },
  async (input): Promise<RecognizeIntentOutput> => {
    const llmResponse = await recognizeIntentPrompt(input);
    
    if (!llmResponse.output) {
      const rawText = llmResponse.response?.text;
      console.error(
        'AI did not return structured output for intent recognition. Raw model response:',
        rawText || 'No raw text available'
      );
      // Fallback or throw a more specific error
      return {
        intent: 'unknown_intent_error',
        entities: { error: `AI failed to provide structured output. Details: ${rawText ? rawText.substring(0,100) : 'No details'}` },
      };
    }

    const { intent, entitiesData } = llmResponse.output;
    let parsedEntities: Record<string, string>;

    try {
      // Ensure entitiesData is not undefined or null before parsing
      if (typeof entitiesData === 'string' && entitiesData.trim() !== '') {
        parsedEntities = JSON.parse(entitiesData);
      } else {
        // If entitiesData is empty or not a string, default to an empty object
        parsedEntities = {};
      }
    } catch (e: any) {
      console.error("Failed to parse entitiesData JSON string:", entitiesData, "Error:", e.message);
      // Fallback for entities if parsing fails
      parsedEntities = { error: "Failed to parse entities JSON string from AI response.", originalData: entitiesData };
    }

    return {
      intent: intent,
      entities: parsedEntities,
    };
  }
);
