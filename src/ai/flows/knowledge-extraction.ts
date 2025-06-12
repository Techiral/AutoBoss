
'use server';

/**
 * @fileOverview Knowledge extraction flow.
 *
 * This flow allows users to upload documents and have the system automatically
 * extract key information and store it in a vector database, so that an agent
 * can effectively answer questions based on that content.
 *
 * @remarks
 *  - `extractKnowledge` - Extracts knowledge from a document.
 *  - `KnowledgeExtractionInput` - Input type for `extractKnowledge`. (Imported from @/lib/types)
 *  - `KnowledgeExtractionOutput` - Output type for `extractKnowledge`. (Imported from @/lib/types)
 */

import {ai} from '@/ai/genkit';
import {
  KnowledgeExtractionInputSchema,
  KnowledgeExtractionOutputSchema,
  type KnowledgeExtractionInput,
  type KnowledgeExtractionOutput,
} from '@/lib/types';

// Re-export types for easy import by other server components/actions if needed from this specific flow file
export type { KnowledgeExtractionInput, KnowledgeExtractionOutput };

export async function extractKnowledge(input: KnowledgeExtractionInput): Promise<KnowledgeExtractionOutput> {
  return extractKnowledgeFlow(input);
}

const extractKnowledgePrompt = ai.definePrompt({
  name: 'extractKnowledgePrompt',
  input: {schema: KnowledgeExtractionInputSchema}, // Uses imported schema
  output: {schema: KnowledgeExtractionOutputSchema}, // Uses imported schema
  prompt: `You are an expert knowledge extractor. Your goal is to process a document and prepare it for a knowledge base.

Document Content (provided as a data URI): {{media url=documentDataUri}}

{{#if isPreStructuredText}}
The provided document content is pre-structured text (e.g., from a CSV that has been converted to detailed textual rows).
For your "summary" output, you MUST return the *exact, verbatim content* of the documentDataUri. Do NOT summarize or alter it.
Then, analyze this full structured text to generate a list of relevant "keywords".
{{else}}
Read the document content and extract the key information from it.
Then, for your output:
1.  Write a concise "summary" of the document.
2.  List relevant "keywords".
{{/if}}

Your response MUST be a single, valid JSON object adhering to the output schema, containing "summary" and "keywords".
`,
});

const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: KnowledgeExtractionInputSchema, // Uses imported schema
    outputSchema: KnowledgeExtractionOutputSchema, // Uses imported schema
  },
  async (input: KnowledgeExtractionInput): Promise<KnowledgeExtractionOutput> => {
    try {
      const modelResponse = await extractKnowledgePrompt(input);
      
      if (!modelResponse.output) {
        const rawText = modelResponse.response?.text;
        console.error(
          'Failed to get structured output from extractKnowledgePrompt. Raw model response:',
          rawText || 'No raw text available'
        );

        // Attempt to parse raw text if it seems like JSON and matches the schema
        if (rawText) {
          try {
            const parsedFallback = JSON.parse(rawText);
            if (KnowledgeExtractionOutputSchema.safeParse(parsedFallback).success) {
              console.warn("extractKnowledgeFlow: Successfully parsed raw text as fallback output.");
              return parsedFallback as KnowledgeExtractionOutput;
            }
          } catch (e) {
            // Not valid JSON or doesn't match schema, will fall through to throw
          }
        }
        throw new Error(
          `AI model did not return the expected JSON format. Raw response snippet: ${rawText ? rawText.substring(0, 100) + '...' : 'N/A'}`
        );
      }
      return modelResponse.output;

    } catch (flowError: any) {
      console.error("Critical error in extractKnowledgeFlow:", flowError.message, flowError.stack);
      // Re-throw a standard error to ensure Next.js can handle it and pass to client
      // It's crucial that the error message here is helpful.
      let detailedErrorMessage = 'Knowledge extraction process failed.';
      if (flowError.message) {
        detailedErrorMessage += ` Details: ${flowError.message}`;
      }
      if (flowError.cause && flowError.cause.message) {
         detailedErrorMessage += ` Cause: ${flowError.cause.message}`;
      }
      // Check for common Genkit/Gemini issues if possible (e.g. API key, quota, content filtering)
      // This is a placeholder for more specific error type checking if Genkit provides it
      if (typeof flowError.message === 'string' && (flowError.message.includes('API key') || flowError.message.includes('quota'))) {
        detailedErrorMessage = `There might be an issue with the AI service configuration (e.g., API key or quota). Original error: ${flowError.message}`;
      } else if (typeof flowError.message === 'string' && flowError.message.includes('SAFETY')) {
        detailedErrorMessage = `The AI model blocked the request due to safety settings. Original error: ${flowError.message}`;
      }

      throw new Error(detailedErrorMessage);
    }
  }
);

    