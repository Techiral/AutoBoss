
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

// Helper function to extract text and title from HTML
const extractContentFromHtml = (html: string): { title?: string, text: string } => {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

  const textContent = htmlToTextConverter(html, {
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
      { selector: 'article', format: 'block', options: { itemProp: 'articleBody'} },
      { selector: 'main', format: 'block', options: {} },
      { selector: '[role="main"]', format: 'block', options: {}},
      { selector: '.post-content', format: 'block', options: {} },
      { selector: '.entry-content', format: 'block', options: {} },
      { selector: '.article-body', format: 'block', options: {} },
      { selector: '.content', format: 'block', options: {} },
      { selector: '.blog-post', format: 'block', options: {} },
      { selector: '.single-post-content', format: 'block', options: {} },
      { selector: 'section > .meteredContent', format: 'block', options: {} },
    ],
  });

  return { title: pageTitle, text: textContent };
};


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
    
    // Attempt 1: Direct fetch with axios (fast, for static sites)
    try {
        console.log(`Attempting direct fetch for URL: ${input.url}`);
        const response = await axios.get(input.url, {
            headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/xml;q=0.9',
            'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 10000 // 10 seconds timeout
        });

        const contentType = response.headers['content-type']?.toLowerCase() || '';
         if (
            contentType &&
            !contentType.includes('text/html') &&
            !contentType.includes('text/plain') &&
            !contentType.includes('text/xml') &&
            !contentType.includes('application/xml') &&
            !contentType.includes('application/xhtml+xml') &&
            !contentType.includes('application/rss+xml') &&
            !contentType.includes('application/atom+xml')
        ) {
            throw new Error(`Unsupported content type: ${contentType}. This tool primarily processes web pages.`);
        }

        const { title, text } = extractContentFromHtml(response.data);

        // If direct fetch gives enough content, return it.
        if (text.trim().length > 500) { // 500 chars as a heuristic for "enough content"
            console.log(`Direct fetch successful for ${input.url}. Content length: ${text.length}`);
            return {
                url: input.url,
                title: title,
                extractedText: text,
            };
        }
        console.log(`Direct fetch for ${input.url} yielded insufficient content (${text.length} chars). Attempting fallback.`);

    } catch (error: any) {
        console.warn(`Direct fetch for ${input.url} failed: ${error.message}. Attempting fallback.`);
    }

    // Attempt 2: Fallback to a browser-based scraping service for dynamic/JS-heavy sites
    try {
        console.log(`Attempting browser-based fetch for URL: ${input.url}`);
        const Jina_API_KEY = process.env.JINA_API_KEY;
        if (!Jina_API_KEY) {
            throw new Error("The advanced URL processing service (Jina) is not configured. Please add a JINA_API_KEY to your environment variables.");
        }
        
        const response = await axios.get(`https://r.jina.ai/${input.url}`, {
            headers: {
                'Authorization': `Bearer ${Jina_API_KEY}`,
                'Accept': 'text/plain',
            },
            timeout: 45000 // 45 seconds timeout for browser rendering
        });

        const textContent = response.data;

        if (!textContent || typeof textContent !== 'string' || textContent.trim().length < 10) {
            throw new Error("The advanced scraping service returned no meaningful content. The page might be protected, empty, or inaccessible.");
        }
        
        // We don't get a title directly from this API, so we'll have to rely on a generic name
        const urlObject = new URL(input.url);
        const pageTitle = urlObject.hostname.replace(/^www\./, '');

        return {
            url: input.url,
            title: pageTitle,
            extractedText: textContent,
        };
    } catch (error: any) {
        console.error(`Error processing URL ${input.url} with browser-based fallback:`, error.message);
        let userFriendlyMessage = `Failed to fetch and process content from URL ${input.url}. `;
        if (axios.isAxiosError(error) && error.response) {
            userFriendlyMessage += `Service responded with status ${error.response.status}. The page may be inaccessible, or the scraping service credits may be exhausted.`;
        } else {
            userFriendlyMessage += error.message;
        }
        throw new Error(userFriendlyMessage);
    }
  }
);
