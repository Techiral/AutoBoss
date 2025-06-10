
import { type NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge', // Use the Edge Function runtime
};

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(ddgUrl, {
      headers: {
        // DDG sometimes blocks default fetch User-Agent, so let's try to mimic a browser
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`DuckDuckGo request failed with status: ${response.status} for query: ${query}`);
      return NextResponse.json({ error: `Failed to fetch from DuckDuckGo, status: ${response.status}` }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    // Adjust selectors based on DDG's HTML structure (this might change!)
    // Common selectors: .result, .result__body, .result__a, .result__snippet
    $('.result').each((i, el) => {
      const resultBody = $(el).find('.result__body');
      if (resultBody.length > 0) { // Ensure we are looking inside a result body
        const titleElement = resultBody.find('.result__a');
        const title = titleElement.text().trim();
        let link = titleElement.attr('href');
        const snippet = resultBody.find('.result__snippet').text().trim();

        if (link) {
          // DDG links are often relative or redirects, try to clean them up
          if (link.startsWith('/l/')) {
            const actualLink = new URLSearchParams(link.split('uddg=')[1]).get('');
            if (actualLink) link = decodeURIComponent(actualLink);
          }
          // Ensure it's a full URL
          if (!link.startsWith('http')) {
            try {
              const urlObj = new URL(link, 'https://duckduckgo.com'); // Base for relative links if any
              link = urlObj.toString();
            } catch (e) {
              // ignore if link is malformed
            }
          }
        }
        
        if (title && link && snippet) {
          results.push({ title, link, snippet });
        }
      } else { // Fallback for slightly different structures if any
        const titleElement = $(el).find('h2.result__title > a.result__a');
        const title = titleElement.text().trim();
        let link = titleElement.attr('href');
        const snippetElement = $(el).find('a.result__snippet');
        const snippet = snippetElement.text().trim();
        
        if (link) {
            if (link.startsWith('/l/')) {
                const actualLink = new URLSearchParams(link.split('uddg=')[1]).get('');
                if (actualLink) link = decodeURIComponent(actualLink);
            }
             if (!link.startsWith('http')) {
                try {
                  const urlObj = new URL(link, 'https://duckduckgo.com');
                  link = urlObj.toString();
                } catch (e) {}
              }
        }
        if (title && link && snippet) {
          results.push({ title, link, snippet });
        }
      }
    });
    
    // If results are empty, log the HTML for debugging DDG structure changes
    if (results.length === 0 && html.length > 100) {
        console.warn(`No results parsed from DDG for query: "${query}". HTML length: ${html.length}. This might indicate a DDG HTML structure change or a block.`);
        // Consider logging a snippet of the HTML if necessary for debugging, but be mindful of log size.
    }


    return NextResponse.json(results.slice(0, 5), { // Return top 5 results
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // For development, restrict in prod
      }
    });

  } catch (error: any) {
    console.error(`Error in /api/search for query "${query}":`, error);
    return NextResponse.json({ error: 'Failed to perform search', details: error.message }, { status: 500 });
  }
}
