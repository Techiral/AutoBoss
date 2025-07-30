
'use server';
/**
 * @fileOverview A flow for processing a URL to extract its main content and title.
 *
 * - processUrl - Fetches content from a URL, extracts text, and gets the title.
 * - ProcessUrlInput - The input type for the processUrl function.
 * - ProcessedUrlOutput - The return type for the processUrl function. (Type imported from types.ts)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';
import {
  ProcessedUrlOutputSchema, // This schema is for the flow's output
  type ProcessedUrlOutput    // This is the type for the flow's output
} from '@/lib/types';

const ProcessUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to process.'),
});
export type ProcessUrlInput = z.infer<typeof ProcessUrlInputSchema>;

// Re-export ProcessedUrlOutput type for clarity if this file is imported elsewhere for its types
export type { ProcessedUrlOutput };


export async function processUrl(input: ProcessUrlInput): Promise<ProcessedUrlOutput> {
  return processUrlFlow(input);
}

const processUrlFlow = ai.defineFlow(
  {
    name: 'processUrlFlow',
    inputSchema: ProcessUrlInputSchema,
    outputSchema: ProcessedUrlOutputSchema,
  },
  async (input: ProcessUrlInput): Promise<ProcessedUrlOutput> => {
    
    try {
        const processingUrl = `https://md.dhr.wtf/?url=${encodeURIComponent(input.url)}`;
        console.log(`Attempting to process URL with md.dhr.wtf: ${input.url}`);
        
        const response = await axios.get(processingUrl, {
            headers: {
                'Accept': 'text/plain',
            },
            timeout: 45000 // 45 seconds timeout for browser rendering
        });

        const textContent = response.data;
        const pageTitle = textContent.split('\n')[0] || new URL(input.url).hostname; // Use first line as title

        if (!textContent || typeof textContent !== 'string' || textContent.trim().length < 10) {
            throw new Error("The scraping service returned no meaningful content. The page might be protected, empty, or inaccessible.");
        }

        return {
            url: input.url,
            title: pageTitle.replace(/^#\s*/, '').trim(), // Remove markdown heading from title
            extractedText: textContent,
        };

    } catch (error: any) {
        console.error(`Error processing URL ${input.url} with md.dhr.wtf:`, error.message);
        let userFriendlyMessage = `Failed to fetch and process content from URL: ${input.url}. `;

        if (axios.isAxiosError(error) && error.response) {
             if (error.response.status === 500 || error.response.status === 403) {
                 const lowerCaseUrl = input.url.toLowerCase();
                 if (lowerCaseUrl.includes('linkedin.com') || lowerCaseUrl.includes('facebook.com') || lowerCaseUrl.includes('instagram.com') || lowerCaseUrl.includes('twitter.com') || lowerCaseUrl.includes('x.com')) {
                    userFriendlyMessage = `This site (${new URL(input.url).hostname}) is protected and requires a login, so its content cannot be automatically used for training. Please copy and paste the relevant text instead.`;
                 } else {
                    userFriendlyMessage += `The service responded with status ${error.response.status}. The page may be inaccessible, require a login, or the service may be temporarily down.`;
                 }
            } else {
                 userFriendlyMessage += `The service responded with status ${error.response.status}.`;
            }
        } else {
            userFriendlyMessage += error.message;
        }
        
        throw new Error(userFriendlyMessage);
    }
  }
);
