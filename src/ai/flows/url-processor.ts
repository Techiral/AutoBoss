
'use server';
/**
 * @fileOverview A flow for processing a URL to extract its main content and title using a fallback mechanism.
 *
 * - processUrl - Fetches content from a URL using multiple services, extracts text, and gets the title.
 * - ProcessUrlInput - The input type for the processUrl function.
 * - ProcessedUrlOutput - The return type for the processUrl function. (Type imported from types.ts)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';
import { htmlToText } from 'html-to-text';
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
  async ({ url }): Promise<ProcessedUrlOutput> => {
    let lastError: any = new Error("All processing methods failed.");

    // Method 1: Try md.dhr.wtf service
    try {
      console.log(`[URL Processor] Attempt 1: Processing ${url} with md.dhr.wtf`);
      const response = await axios.get(`https://md.dhr.wtf/?url=${encodeURIComponent(url)}`, {
        headers: { 'Accept': 'text/plain' },
        timeout: 45000,
      });

      if (response.data && typeof response.data === 'string' && response.data.trim().length > 100) {
        const pageTitle = response.data.split('\n')[0] || new URL(url).hostname;
        console.log(`[URL Processor] Success with md.dhr.wtf for ${url}`);
        return {
          url,
          title: pageTitle.replace(/^#\s*/, '').trim(),
          extractedText: response.data,
        };
      }
      lastError = new Error("md.dhr.wtf returned minimal or no content.");
    } catch (error: any) {
      console.warn(`[URL Processor] md.dhr.wtf failed for ${url}:`, error.message);
      lastError = error;
    }

    // Method 2: Fallback to Jina AI Reader (r.jina.ai)
    try {
      console.log(`[URL Processor] Attempt 2: Processing ${url} with r.jina.ai`);
      const response = await axios.get(`https://r.jina.ai/${url}`, {
        headers: { 'Accept': 'text/plain' },
        timeout: 45000,
      });

      if (response.data && typeof response.data === 'string' && response.data.trim().length > 100) {
        const pageTitle = response.data.split('\n')[0] || new URL(url).hostname;
        console.log(`[URL Processor] Success with r.jina.ai for ${url}`);
        return {
          url,
          title: pageTitle.replace(/^#\s*/, '').trim(),
          extractedText: response.data,
        };
      }
       lastError = new Error("r.jina.ai returned minimal or no content.");
    } catch (error: any) {
      console.warn(`[URL Processor] r.jina.ai failed for ${url}:`, error.message);
      lastError = error;
    }

    // Method 3: Final fallback to basic axios + html-to-text
    try {
      console.log(`[URL Processor] Attempt 3: Processing ${url} with basic axios`);
      const response = await axios.get(url, { timeout: 15000 });
      const textContent = htmlToText(response.data, {
        wordwrap: 130,
        selectors: [
          { selector: 'a', options: { ignoreHref: true } },
          { selector: 'img', format: 'skip' },
        ],
      });
      
      if (textContent && textContent.trim().length > 100) {
        const titleMatch = response.data.match(/<title>(.*?)<\/title>/);
        const pageTitle = titleMatch ? titleMatch[1] : new URL(url).hostname;
        console.log(`[URL Processor] Success with basic axios for ${url}`);
        return {
          url,
          title: pageTitle,
          extractedText: textContent,
        };
      }
      lastError = new Error("Basic axios scrape returned minimal or no content.");
    } catch (error: any) {
      console.error(`[URL Processor] All methods failed. Final error from basic axios on ${url}:`, error.message);
      lastError = error;
    }

    // If all methods fail, throw a user-friendly error based on the last recorded error
    let userFriendlyMessage = `Failed to fetch and process content from URL: ${url}. `;
    if (axios.isAxiosError(lastError) && lastError.response) {
      userFriendlyMessage += `The last attempt failed with status ${lastError.response.status}. The page may be inaccessible, require a login, or the services may be temporarily down.`;
    } else {
      userFriendlyMessage += lastError.message;
    }
    
    // Add specific advice for common protected sites
    const lowerCaseUrl = url.toLowerCase();
    if (lowerCaseUrl.includes('linkedin.com') || lowerCaseUrl.includes('facebook.com') || lowerCaseUrl.includes('instagram.com') || lowerCaseUrl.includes('x.com')) {
      userFriendlyMessage = `This site (${new URL(url).hostname}) is protected and requires a login, so its content cannot be automatically used for training. Please copy and paste the relevant text instead.`;
    }

    throw new Error(userFriendlyMessage);
  }
);
