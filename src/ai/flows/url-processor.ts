
'use server';
/**
 * @fileOverview A flow for processing a URL to extract its main content,
 * then summarize it and extract keywords using the knowledge-extraction flow.
 *
 * - processUrl - Fetches content from a URL, extracts text, and then gets summary/keywords.
 * - ProcessUrlInput - The input type for the processUrl function.
 * - ProcessUrlOutput - The return type for the processUrl function (same as KnowledgeExtractionOutput).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';
import { convert } from 'html-to-text';
import { extractKnowledge, KnowledgeExtractionOutputSchema, KnowledgeExtractionInput } from './knowledge-extraction';

const ProcessUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to process.'),
});
export type ProcessUrlInput = z.infer<typeof ProcessUrlInputSchema>;

// Output is the same as KnowledgeExtractionOutput
export type ProcessUrlOutput = z.infer<typeof KnowledgeExtractionOutputSchema>;

export async function processUrl(input: ProcessUrlInput): Promise<ProcessUrlOutput> {
  return processUrlFlow(input);
}

const processUrlFlow = ai.defineFlow(
  {
    name: 'processUrlFlow',
    inputSchema: ProcessUrlInputSchema,
    outputSchema: KnowledgeExtractionOutputSchema,
  },
  async (input: ProcessUrlInput): Promise<ProcessUrlOutput> => {
    let textContent: string;
    try {
      const response = await axios.get(input.url, {
        headers: {
          // Some websites might block requests without a common User-Agent
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        },
        timeout: 10000 // 10 seconds timeout
      });

      if (response.headers['content-type'] && !response.headers['content-type'].includes('text/html')) {
        throw new Error(`Content type is not HTML: ${response.headers['content-type']}`);
      }
      
      textContent = convert(response.data, {
        wordwrap: false, // Disable auto-wrapping
        selectors: [
          { selector: 'img', format: 'skip' }, // Skip images
          { selector: 'a', options: { ignoreHref: true } }, // Keep link text, ignore href
          // Add more selectors to skip unwanted elements like nav, footer, script, style
          { selector: 'nav', format: 'skip' },
          { selector: 'footer', format: 'skip' },
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
          { selector: 'aside', format: 'skip'},
          { selector: 'header', format: 'skip'}
        ],
      });

      if (!textContent.trim()) {
        throw new Error('No meaningful text content extracted from the URL.');
      }

    } catch (error: any) {
      console.error(`Error fetching or parsing URL ${input.url}:`, error.message);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL ${input.url}. Status: ${error.response?.status || 'N/A'}. Message: ${error.message}`);
      }
      throw new Error(`Error processing URL ${input.url}: ${error.message}`);
    }

    // Create a data URI from the extracted text
    const plainTextDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(textContent).toString('base64')}`;

    const knowledgeInput: KnowledgeExtractionInput = {
      documentDataUri: plainTextDataUri,
    };

    try {
      const knowledgeOutput = await extractKnowledge(knowledgeInput);
      return knowledgeOutput;
    } catch (extractionError: any) {
      console.error(`Error extracting knowledge from URL ${input.url} content:`, extractionError.message);
      throw new Error(`Failed to extract knowledge from URL content: ${extractionError.message}`);
    }
  }
);
