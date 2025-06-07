
'use server';
/**
 * @fileOverview A Genkit flow to fetch content from a URL and extract its main text.
 *
 * - processUrlContent - Fetches a URL, if HTML, extracts main text using an LLM.
 * - ProcessUrlContentInput - Input schema for the flow.
 * - ProcessUrlContentOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessUrlContentInputSchema = z.object({
  url: z.string().url().describe('The URL to fetch and process.'),
});
export type ProcessUrlContentInput = z.infer<typeof ProcessUrlContentInputSchema>;

const ProcessUrlContentOutputSchema = z.object({
  textContent: z.string().describe('The main textual content extracted from the URL. Empty if extraction fails or content is not text-based.').nullable(),
  fileNameSuggestion: z.string().describe('A suggested filename based on the URL.'),
  error: z.string().optional().describe('Error message if processing failed.'),
});
export type ProcessUrlContentOutput = z.infer<typeof ProcessUrlContentOutputSchema>;

// Helper function to suggest a filename from a URL
function suggestFilenameFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        let pathName = urlObj.pathname;
        if (pathName === '/' || !pathName) {
            // Use hostname if path is trivial
            pathName = urlObj.hostname.replace(/^www\./, '');
        } else {
             // Get last part of path
            pathName = pathName.substring(pathName.lastIndexOf('/') + 1);
        }
        // Remove problematic characters and extensions, ensure it's not too long
        let name = pathName.replace(/\.(html|htm|php|aspx?|jsp|txt)$/i, '') 
                           .replace(/[^a-zA-Z0-9_.-]/g, '_') 
                           .substring(0, 50);
        return name || 'web_content';
    } catch (e) {
        return 'web_content_error_parsing_url';
    }
}


const extractTextFromHtmlPrompt = ai.definePrompt({
    name: 'extractTextFromHtmlPrompt',
    input: { schema: z.object({ htmlContent: z.string() }) },
    output: { schema: z.object({ extractedText: z.string() }) },
    prompt: `You are an expert at extracting the main textual content from an HTML page.
    Your task is to ignore navigation menus, sidebars, advertisements, footers, scripts, and other boilerplate content.
    Focus on returning only the primary article, blog post, or informational content.
    If the HTML appears to be an error page or has no discernible main content, return an empty string or a very brief note like "No main content found."

    HTML Content:
    \`\`\`html
    {{{htmlContent}}}
    \`\`\`

    Extracted Text:
    `
});


export async function processUrlContent(input: ProcessUrlContentInput): Promise<ProcessUrlContentOutput> {
  return processUrlContentFlow(input);
}

const processUrlContentFlow = ai.defineFlow(
  {
    name: 'processUrlContentFlow',
    inputSchema: ProcessUrlContentInputSchema,
    outputSchema: ProcessUrlContentOutputSchema,
  },
  async ({ url }): Promise<ProcessUrlContentOutput> => {
    const fileNameSuggestion = suggestFilenameFromUrl(url);
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'AgentVerse-KnowledgeFetcher/1.0' }});
      if (!response.ok) {
        return { textContent: null, fileNameSuggestion, error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
      }

      const contentType = response.headers.get('content-type');
      const bodyText = await response.text();

      if (contentType && contentType.includes('text/html')) {
        if (bodyText.trim() === '') {
             return { textContent: null, fileNameSuggestion, error: 'Fetched HTML content is empty.' };
        }
        // Use LLM to extract main content from HTML
        const llmResult = await extractTextFromHtmlPrompt({ htmlContent: bodyText });
        if (!llmResult.output || !llmResult.output.extractedText) {
            return { textContent: null, fileNameSuggestion, error: 'AI failed to extract text from HTML.' };
        }
        return { textContent: llmResult.output.extractedText, fileNameSuggestion, error: undefined };

      } else if (contentType && contentType.includes('text/plain')) {
        return { textContent: bodyText, fileNameSuggestion, error: undefined };
      } else {
        // For other content types, we might not be able to process them directly here.
        // The original extractKnowledge flow might handle some via data URI (like PDF if Gemini supports it).
        // For this flow, we'll indicate it's not plain text or HTML.
        return { textContent: null, fileNameSuggestion, error: `Unsupported content type for direct text extraction: ${contentType}. Try uploading the file directly if possible.` };
      }
    } catch (error: any) {
      console.error(`Error processing URL ${url}:`, error);
      return { textContent: null, fileNameSuggestion, error: error.message || 'An unknown error occurred while processing the URL.' };
    }
  }
);

    