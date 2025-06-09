
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
import { convert as htmlToTextConverter } from 'html-to-text';
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

/**
 * Fetches the content of a URL using a scraping API (ScrapeNinja).
 * @param url The URL to fetch.
 * @returns The HTML content of the page.
 * @throws Error if fetching fails.
 */
async function fetchRenderedPageViaScrapingAPI(url: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_SCRAPENINJA_API_KEY;
  if (!apiKey) {
    throw new Error("Scraping API key (NEXT_PUBLIC_SCRAPENINJA_API_KEY) is not set. Please configure it in your environment variables to process dynamic websites effectively.");
  }
  const scrapingApiUrl = `https://api.scrapeninja.net/scrape?url=${encodeURIComponent(url)}&js=true`;

  try {
    const response = await axios.get(scrapingApiUrl, {
      headers: { 'x-api-key': apiKey },
      timeout: 20000, // Increased timeout for scraping
    });
    if (response.data && response.data.html) {
      return response.data.html;
    } else if (response.data && response.data.error) {
      throw new Error(`ScrapeNinja API error: ${response.data.error}`);
    }
    throw new Error('Invalid response structure from ScrapeNinja API.');
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND' && error.config?.url?.includes('api.scrapeninja.net')) {
        throw new Error(`Network Error: Could not resolve the domain api.scrapeninja.net. This indicates a DNS lookup failure. Please check the server's network configuration and DNS settings. (Original error: ${error.message})`);
      }
      const status = error.response?.status || 'N/A';
      const responseData = error.response?.data;
      let errorMessage = `Failed to fetch rendered page from ScrapeNinja for URL ${url}. Status: ${status}.`;
      if (responseData && typeof responseData === 'string') {
        errorMessage += ` Response: ${responseData.substring(0, 200)}`;
      } else if (responseData && responseData.error) {
        errorMessage += ` Response: ${responseData.error}`;
      } else if (responseData) {
        errorMessage += ` Response: ${JSON.stringify(responseData).substring(0,200)}`;
      }
      throw new Error(errorMessage);
    }
    throw new Error(`Failed to fetch rendered page from ScrapeNinja for URL ${url}: ${error.message}`);
  }
}

const processUrlFlow = ai.defineFlow(
  {
    name: 'processUrlFlow',
    inputSchema: ProcessUrlInputSchema,
    outputSchema: ProcessedUrlOutputSchema, // Use the imported schema for the flow's output
  },
  async (input: ProcessUrlInput): Promise<ProcessedUrlOutput> => { // Return the correct type
    let htmlContent: string;
    let textContent: string;
    let pageTitle: string | undefined;

    const scrapingApiKey = process.env.NEXT_PUBLIC_SCRAPENINJA_API_KEY;

    try {
      if (scrapingApiKey) {
        console.log(`Attempting to fetch URL with ScrapeNinja: ${input.url}`);
        htmlContent = await fetchRenderedPageViaScrapingAPI(input.url);
      } else {
        console.warn(`ScrapeNinja API key not found. Attempting direct fetch for URL: ${input.url}. This may not work for JavaScript-heavy sites.`);
        const response = await axios.get(input.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          },
          timeout: 10000
        });
        htmlContent = response.data;
         if (response.headers['content-type'] &&
            !response.headers['content-type'].includes('text/html') &&
            !response.headers['content-type'].includes('text/plain')) {
             throw new Error(`Content type is not HTML or plain text: ${response.headers['content-type']}. Only web pages or plain text URLs are supported for direct fetch.`);
        }
      }

      // Extract title from HTML
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

      // Convert HTML to text
      textContent = htmlToTextConverter(htmlContent, {
        wordwrap: false,
        selectors: [
          { selector: 'a', format: 'inline', options: { hideLinkHrefIfSameAsText: true, ignoreHref: false } },
          { selector: 'img', format: 'skip' },
          { selector: 'nav', format: 'skip' },
          { selector: 'footer', format: 'skip' },
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
          { selector: 'aside', format: 'skip' },
          { selector: 'header', format: 'skip' },
          { selector: 'form', format: 'skip' },
          { selector: 'button', format: 'skip' },
          { selector: 'input', format: 'skip' },
          { selector: 'textarea', format: 'skip' },
          { selector: 'select', format: 'skip' },
          { selector: 'iframe', format: 'skip'},
          { selector: 'svg', format: 'skip'},
          { selector: 'noscript', format: 'skip'},
          { selector: 'canvas', format: 'skip'},
          // Try to keep main content areas
          { selector: 'article', options: { itemProp: 'articleBody'} },
          { selector: 'main', options: {} },
          { selector: '[role="main"]', options: {}},
        ],
      });

      if (!textContent.trim()) {
        throw new Error('No meaningful text content extracted from the URL. The page might be empty, heavily JavaScript-based and failed to render, or an unsupported format.');
      }

      // Return the structured output matching ProcessedUrlOutputSchema
      return {
        url: input.url,
        title: pageTitle,
        extractedText: textContent,
      };

    } catch (error: any) {
      console.error(`Error processing URL ${input.url}:`, error.message);
      // Propagate the error with a more generic message for the flow, specific details are logged above or in fetchRenderedPageViaScrapingAPI
      throw new Error(`Failed to fetch and process content from URL ${input.url}. Reason: ${error.message}`);
    }
  }
);


/**
 * Chunks a given text into smaller pieces based on sentence boundaries and a maximum length.
 * @param text The text to chunk.
 * @param maxLength The maximum length of each chunk (default: 800 characters).
 * @returns An array of text chunks.
 */
function chunkText(text: string, maxLength = 800): string[] { // Removed 'export'
  if (!text) return [];
  // Normalize whitespace and split into sentences
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const sentences = normalizedText.split(/(?<=[.?!])\s+(?=[A-Z0-9À-ÖØ-öø-ÿ])/); // Split by sentence-ending punctuation followed by space and capital letter/number or common international caps
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if ((currentChunk + ' ' + trimmedSentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
      // If a single sentence is longer than maxLength, split it hard
      while (currentChunk.length > maxLength) {
        chunks.push(currentChunk.substring(0, maxLength));
        currentChunk = currentChunk.substring(maxLength);
      }
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks.filter(chunk => chunk.length > 0);
}
