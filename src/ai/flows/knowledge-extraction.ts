
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
  prompt: `You are an expert knowledge extractor. Your goal is to read a document and extract the key information from it.  Then write a summary and list the keywords.

Document: {{media url=documentDataUri}}`,
});

const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: KnowledgeExtractionInputSchema, // Uses imported schema
    outputSchema: KnowledgeExtractionOutputSchema, // Uses imported schema
  },
  async (input: KnowledgeExtractionInput): Promise<KnowledgeExtractionOutput> => {
    const modelResponse = await extractKnowledgePrompt(input);
    if (!modelResponse.output) {
      const rawText = modelResponse.response?.text;
      console.error(
        'Failed to get structured output from extractKnowledgePrompt. Raw model response:',
        rawText || 'No raw text available'
      );
      throw new Error(
        'AI could not extract knowledge. The model did not return the expected JSON format.'
      );
    }
    return modelResponse.output;
  }
);
