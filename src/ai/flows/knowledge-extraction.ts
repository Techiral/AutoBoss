
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
 *  - `KnowledgeExtractionInput` - Input type for `extractKnowledge`.
 *  - `KnowledgeExtractionOutput` - Output type for `extractKnowledge`.
 *  - `KnowledgeExtractionOutputSchema` - Zod schema for the output of `extractKnowledge`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KnowledgeExtractionInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      'The document to extract knowledge from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type KnowledgeExtractionInput = z.infer<typeof KnowledgeExtractionInputSchema>;

export const KnowledgeExtractionOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key information extracted from the document.'),
  keywords: z
    .array(z.string())
    .describe('A list of keywords that represent the main topics covered in the document.'),
});
export type KnowledgeExtractionOutput = z.infer<typeof KnowledgeExtractionOutputSchema>;

export async function extractKnowledge(input: KnowledgeExtractionInput): Promise<KnowledgeExtractionOutput> {
  return extractKnowledgeFlow(input);
}

const extractKnowledgePrompt = ai.definePrompt({
  name: 'extractKnowledgePrompt',
  input: {schema: KnowledgeExtractionInputSchema},
  output: {schema: KnowledgeExtractionOutputSchema},
  prompt: `You are an expert knowledge extractor. Your goal is to read a document and extract the key information from it.  Then write a summary and list the keywords.

Document: {{media url=documentDataUri}}`,
});

const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: KnowledgeExtractionInputSchema,
    outputSchema: KnowledgeExtractionOutputSchema,
  },
  async input => {
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

