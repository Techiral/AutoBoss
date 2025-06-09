
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
import { extractKnowledge } from './knowledge-extraction';
import { 
  KnowledgeExtractionOutputSchema, 
  type KnowledgeExtractionInput,
  type KnowledgeExtractionOutput 
} from '@/lib/types'; 

const ProcessUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to process.'),
});
export type ProcessUrlInput = z.infer<typeof ProcessUrlInputSchema>;

export type ProcessUrlOutput = KnowledgeExtractionOutput; 

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
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        },
        timeout: 10000 
      });

      if (response.headers['content-type'] && !response.headers['content-type'].includes('text/html')) {
        if (response.headers['content-type'].includes('text/plain')) {
            textContent = response.data;
        } else {
            throw new Error(`Content type is not HTML or plain text: ${response.headers['content-type']}. Only web pages or plain text URLs are supported.`);
        }
      } else if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            textContent = convert(response.data, {
                wordwrap: false, 
                selectors: [
                { selector: 'img', format: 'skip' }, 
                { selector: 'a', options: { ignoreHref: true } }, 
                { selector: 'nav', format: 'skip' },
                { selector: 'footer', format: 'skip' },
                { selector: 'script', format: 'skip' },
                { selector: 'style', format: 'skip' },
                { selector: 'aside', format: 'skip'},
                { selector: 'header', format: 'skip'}
                ],
            });
      } else {
        textContent = typeof response.data === 'string' ? response.data : '';
      }


      if (!textContent.trim()) {
        throw new Error('No meaningful text content extracted from the URL. The page might be empty, heavily JavaScript-based, or an image.');
      }

    } catch (error: any) {
      console.error(`Error fetching or parsing URL ${input.url}:`, error.message);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL ${input.url}. Status: ${error.response?.status || 'N/A'}. Please ensure the URL is correct and publicly accessible.`);
      }
      throw new Error(`Error processing URL ${input.url}: ${error.message}`);
    }

    const plainTextDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(textContent).toString('base64')}`;

    const knowledgeInput: KnowledgeExtractionInput = { 
      documentDataUri: plainTextDataUri,
    };

    try {
      const knowledgeOutput = await extractKnowledge(knowledgeInput);
      return knowledgeOutput;
    } catch (extractionError: any) {
      console.error(`Error extracting knowledge from URL ${input.url} content:`, extractionError.message);
      throw new Error(`Failed to extract knowledge from the website content: ${extractionError.message}`);
    }
  }
);
