
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

    console.log(`Attempting direct fetch for URL: ${input.url}`);
    try {
      const response = await axios.get(input.url, {
        headers: {
          // Using a common browser user-agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000 // 15 seconds timeout
      });
      htmlContent = response.data;

      const contentType = response.headers['content-type']?.toLowerCase() || '';
      if (
        contentType &&
        !contentType.includes('text/html') &&
        !contentType.includes('text/plain') &&
        !contentType.includes('application/xml') && 
        !contentType.includes('application/xhtml+xml') &&
        !contentType.includes('application/rss+xml') &&
        !contentType.includes('application/atom+xml')
      ) {
           throw new Error(`Unsupported content type: ${response.headers['content-type']}. This tool primarily processes HTML, plain text, or XML-based web pages.`);
      }

      // Extract title from HTML
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

      // Convert HTML to text
      textContent = htmlToTextConverter(htmlContent, {
        wordwrap: false, // Keep as false, chunkText will handle wrapping/splitting later if needed
        selectors: [
          // Keep links, but don't duplicate href if it's the same as text
          { selector: 'a', format: 'inline', options: { hideLinkHrefIfSameAsText: true, ignoreHref: false } },
          // Skip common non-content elements
          { selector: 'img', format: 'skip' },
          { selector: 'nav', format: 'skip' },
          { selector: 'footer', format: 'skip' },
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
          { selector: 'aside', format: 'skip' },
          { selector: 'header', format: 'skip' }, // General headers often don't contain main content
          { selector: 'form', format: 'skip' },
          { selector: 'button', format: 'skip' },
          { selector: 'input', format: 'skip' },
          { selector: 'textarea', format: 'skip' },
          { selector: 'select', format: 'skip' },
          { selector: 'iframe', format: 'skip'},
          { selector: 'svg', format: 'skip'},
          { selector: 'noscript', format: 'skip'},
          { selector: 'canvas', format: 'skip'},
          // Prioritize common main content elements
          { selector: 'article', options: { itemProp: 'articleBody'} }, 
          { selector: 'main', options: {} },                         
          { selector: '[role="main"]', options: {}},                  
          // Common class names for content areas in blogs/articles
          { selector: '.post-content', options: {} },
          { selector: '.entry-content', options: {} },
          { selector: '.article-body', options: {} },
          { selector: '.content', options: {} }, 
          { selector: '.blog-post', options: {} },
          { selector: '.single-post-content', options: {} },
          // Medium-like structures (often content is within an <article> but this is more specific if needed)
          { selector: 'section > .meteredContent', options: {} }, 
          // Add any other selectors that might be useful for specific platforms you target
        ],
      });

      if (!textContent.trim()) {
        throw new Error('No meaningful text content extracted from the URL. The page might be empty, primarily image-based, or require JavaScript to render its content. Direct fetching has limitations with highly dynamic sites.');
      }

      // Return the structured output matching ProcessedUrlOutputSchema
      return {
        url: input.url,
        title: pageTitle,
        extractedText: textContent,
      };

    } catch (error: any) {
      console.error(`Error processing URL ${input.url} with direct fetch:`, error.message);
      let userFriendlyMessage = `Failed to fetch and process content from URL ${input.url}. `;
      if (axios.isAxiosError(error)) {
        if (error.response) {
          userFriendlyMessage += `Server responded with status ${error.response.status}. The page may be inaccessible or block direct requests.`;
        } else if (error.request) {
          userFriendlyMessage += `No response received. The server might be down or the URL incorrect.`;
        } else {
          userFriendlyMessage += `Error setting up request: ${error.message}.`;
        }
      } else if (error.message.startsWith('Unsupported content type')) {
         userFriendlyMessage = error.message; // Use the specific error message
      } else {
        userFriendlyMessage += error.message;
      }
      // Ensure the error message propagated to the flow is user-understandable.
      throw new Error(userFriendlyMessage);
    }
  }
);


/**
 * Chunks a given text into smaller pieces based on sentence boundaries and a maximum length.
 * @param text The text to chunk.
 * @param maxLength The maximum length of each chunk (default: 800 characters).
 * @returns An array of text chunks.
 */
function chunkText(text: string, maxLength = 800): string[] {
  if (!text) return [];
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const sentences = normalizedText.split(/(?<=[.?!])\s+(?=[A-Z0-9À-ÖØ-öø-ÿ])/);
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


    