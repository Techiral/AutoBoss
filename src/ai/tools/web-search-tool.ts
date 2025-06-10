
'use server';
/**
 * @fileOverview A web search tool for Genkit that uses a local API endpoint to scrape DuckDuckGo.
 *
 * - webSearchTool - A Genkit tool that performs a web search.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { convert as htmlToText } from 'html-to-text';

const WebSearchInputSchema = z.object({
  searchQuery: z.string().describe('The query to search the web for.'),
});

const WebSearchOutputSchema = z.object({
  searchResultsText: z.string().describe('Concatenated text content from the top 2 web search results, including source URLs and original snippets. Each result is separated by "\\n\\n---\\n\\n". Returns an empty string if no results or errors.'),
});

interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
}

async function fetchAndCleanPage(url: string, maxCharsPerPage = 10000): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      signal: AbortSignal.timeout(8000) // 8 second timeout for fetching page content
    });
    if (!response.ok) {
      console.warn(`WebSearchTool: Failed to fetch page content from ${url}, status: ${response.status}`);
      return `Error: Could not fetch content from ${url} (status ${response.status}).`;
    }
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
        console.warn(`WebSearchTool: Skipping non-HTML/text page: ${url} (Content-Type: ${contentType})`);
        return `Skipped: Content type is ${contentType}, not HTML or plain text.`;
    }

    const htmlContent = await response.text();
    const textContent = htmlToText(htmlContent, {
      wordwrap: false, // Disable auto-wrapping
      selectors: [
        { selector: 'script', format: 'skip' }, // Skip script tags
        { selector: 'style', format: 'skip' },  // Skip style tags
        { selector: 'nav', format: 'skip' },    // Skip nav elements
        { selector: 'footer', format: 'skip' }, // Skip footer elements
        { selector: 'aside', format: 'skip' },  // Skip aside elements
        { selector: 'header', format: 'skip'}, // Skip header elements
        { selector: 'form', format: 'skip'},
        { selector: 'button', format: 'skip'},
        { selector: 'input', format: 'skip'},
        { selector: 'textarea', format: 'skip'},
        { selector: 'select', format: 'skip'},
        { selector: 'img', format: 'skip' },    // Skip images
        { selector: 'svg', format: 'skip' },    // Skip SVGs
        // Optionally, try to focus on main content areas if known
        // { selector: 'article', options: { itemProp: 'articleBody'} },
        // { selector: 'main', options: {} },
      ],
    });
    return textContent.trim().slice(0, maxCharsPerPage);
  } catch (error: any) {
    console.error(`WebSearchTool: Error fetching or cleaning page ${url}:`, error.message);
    return `Error fetching or processing content from ${url}: ${error.message.substring(0,100)}`;
  }
}

export const webSearchTool = ai.defineTool(
  {
    name: 'webSearchTool',
    description: 'Performs a web search for a given query to find external information about companies, people, or topics not covered in the internal knowledge base. Useful for getting general context or recent information.',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async (input) => {
    console.log(`WebSearchTool: Received query "${input.searchQuery}"`);

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:9000'; // Ensure this matches your dev port if NEXT_PUBLIC_APP_DOMAIN isn't set
    const searchApiUrl = `${appDomain}/api/search?q=${encodeURIComponent(input.searchQuery)}`;
    
    let searchResults: SearchResultItem[] = [];
    try {
      const apiResponse = await fetch(searchApiUrl, { signal: AbortSignal.timeout(10000) }); // 10s timeout for DDG search
      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error(`WebSearchTool: Failed to call local search API: ${apiResponse.status} ${apiResponse.statusText}. Body: ${errorBody}`);
        return { searchResultsText: `Error: Could not retrieve search results from the local API (status ${apiResponse.status}).` };
      }
      searchResults = await apiResponse.json();
      if (!Array.isArray(searchResults)) {
        console.error("WebSearchTool: Local search API did not return an array. Response:", searchResults);
        searchResults = [];
      }
    } catch (error: any) {
      console.error(`WebSearchTool: Error calling local search API ${searchApiUrl}:`, error);
      return { searchResultsText: `Error: Could not connect to the local search API: ${error.message}` };
    }

    if (searchResults.length === 0) {
      console.log(`WebSearchTool: No search results found from DDG for query: "${input.searchQuery}"`);
      return { searchResultsText: "No direct search results found for your query. Try rephrasing or be more specific." };
    }

    const topNResults = searchResults.slice(0, 2); // Process top 2 results
    const pageContentsPromises = topNResults.map(async (result) => {
      if (!result.link || !result.link.startsWith('http')) {
        console.warn(`WebSearchTool: Invalid or missing link for result "${result.title}": ${result.link}`);
        return `Source: ${result.title || 'N/A'}\nSnippet: ${result.snippet}\nContent: Could not fetch (invalid link).`;
      }
      const cleanedText = await fetchAndCleanPage(result.link);
      return `Source URL: ${result.link}\nTitle: ${result.title}\nOriginal Snippet: ${result.snippet}\n\nExtracted Content:\n${cleanedText || 'No text content extracted.'}`;
    });
    
    const resolvedPageContents = await Promise.all(pageContentsPromises);
    const combinedText = resolvedPageContents.join('\n\n---\n\n');
    
    console.log(`WebSearchTool: Compiled search results text for LLM. Length: ${combinedText.length}`);
    return {
      searchResultsText: combinedText,
    };
  }
);
