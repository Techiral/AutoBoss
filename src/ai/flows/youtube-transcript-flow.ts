
'use server';
/**
 * @fileOverview A Genkit flow for fetching YouTube video transcripts.
 *
 * - fetchYouTubeTranscript - Fetches the transcript of a YouTube video.
 * - FetchYouTubeTranscriptInput - Input schema for the flow.
 * - FetchYouTubeTranscriptOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { YoutubeTranscript } from 'youtube-transcript';

const FetchYouTubeTranscriptInputSchema = z.object({
  youtubeUrl: z.string().url().describe('The URL of the YouTube video.'),
});
export type FetchYouTubeTranscriptInput = z.infer<typeof FetchYouTubeTranscriptInputSchema>;

const FetchYouTubeTranscriptOutputSchema = z.object({
  transcriptText: z.string().optional().describe('The concatenated transcript text of the video.'),
  videoId: z.string().optional().describe('The ID of the YouTube video processed.'),
  error: z.string().optional().describe('An error message if fetching failed.'),
});
export type FetchYouTubeTranscriptOutput = z.infer<typeof FetchYouTubeTranscriptOutputSchema>;

export async function fetchYouTubeTranscript(input: FetchYouTubeTranscriptInput): Promise<FetchYouTubeTranscriptOutput> {
  return youtubeTranscriptFlow(input);
}

function extractYouTubeVideoId(url: string): string | null {
  let videoId: string | null = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.split('/')[1]?.split('?')[0] || null;
    } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      videoId = urlObj.searchParams.get('v');
      if (!videoId) {
        if (urlObj.pathname.startsWith('/embed/')) {
          videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0] || null;
        } else if (urlObj.pathname.startsWith('/shorts/')) {
          videoId = urlObj.pathname.split('/shorts/')[1]?.split('?')[0] || null;
        } else if (urlObj.pathname.startsWith('/live/')) {
            videoId = urlObj.pathname.split('/live/')[1]?.split('?')[0] || null;
        }
      }
    }
  } catch (e) {
    console.error(`[YouTube Transcript Flow] Error parsing URL for Video ID: ${url}`, e);
    return null;
  }
  // Validate basic YouTube ID format (11 chars, alphanumeric, -, _)
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return videoId;
  }
  return null;
}


const youtubeTranscriptFlow = ai.defineFlow(
  {
    name: 'youtubeTranscriptFlow',
    inputSchema: FetchYouTubeTranscriptInputSchema,
    outputSchema: FetchYouTubeTranscriptOutputSchema,
  },
  async (input: FetchYouTubeTranscriptInput): Promise<FetchYouTubeTranscriptOutput> => {
    let videoId: string | null = null;
    try {
      videoId = extractYouTubeVideoId(input.youtubeUrl);

      if (!videoId) {
        return { error: 'Could not extract a valid YouTube Video ID from the URL. Please provide a standard YouTube video URL (e.g., watch, shorts, embed, youtu.be).' };
      }
      console.log(`[YouTube Transcript Flow] Extracted Video ID: ${videoId}`);

      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        console.log(`[YouTube Transcript Flow] Library returned empty transcript array for Video ID: ${videoId}`);
        return { videoId, error: 'The transcript library found no transcript segments for this video. This might be due to language settings, the type of transcript available on YouTube, or it might be disabled by the uploader.' };
      }

      const transcriptText = transcript.map(item => item.text).join(' ');
      console.log(`[YouTube Transcript Flow] Fetched transcript for Video ID ${videoId}, length: ${transcriptText.length}`);
      return { transcriptText, videoId };

    } catch (error: any) {
      console.error(`[YouTube Transcript Flow] Error processing YouTube URL ${input.youtubeUrl} (Video ID: ${videoId || 'unknown'}):`, error.message);
      let errorMessage = 'Failed to fetch transcript due to an unexpected error.';
      
      // Use more specific error messages from the library if available
      if (error.message) {
        if (error.message.toLowerCase().includes('transcripts are disabled')) {
          errorMessage = 'Transcripts appear to be disabled for this YouTube video.';
        } else if (error.message.toLowerCase().includes('no transcript found')) { // This catches various "no transcript found" messages from the library
          errorMessage = 'The transcript library reported that no transcript could be found for this video. It might be private, deleted, or lack transcripts in common languages.';
        } else if (error.message.toLowerCase().includes('is private or deleted')) {
            errorMessage = 'This video may be private or deleted, so its transcript cannot be accessed.';
        }
         else {
          // Pass through a snippet of the original error if it's not one of the common cases
          errorMessage = `YouTube transcript error: ${error.message.substring(0, 200)}`;
        }
      }
      return { videoId, error: errorMessage };
    }
  }
);

