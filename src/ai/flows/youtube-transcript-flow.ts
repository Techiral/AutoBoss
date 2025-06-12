
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

const youtubeTranscriptFlow = ai.defineFlow(
  {
    name: 'youtubeTranscriptFlow',
    inputSchema: FetchYouTubeTranscriptInputSchema,
    outputSchema: FetchYouTubeTranscriptOutputSchema,
  },
  async (input: FetchYouTubeTranscriptInput): Promise<FetchYouTubeTranscriptOutput> => {
    let videoId: string | undefined;
    try {
      const url = new URL(input.youtubeUrl);
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.substring(1);
      } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
        videoId = url.searchParams.get('v') || undefined;
        if (!videoId && url.pathname.startsWith('/embed/')) {
            videoId = url.pathname.split('/embed/')[1].split('?')[0];
        } else if (!videoId && url.pathname.startsWith('/shorts/')) {
            videoId = url.pathname.split('/shorts/')[1].split('?')[0];
        }
      }

      if (!videoId) {
        return { error: 'Could not extract Video ID from the URL. Please provide a valid YouTube video URL.' };
      }
      console.log(`[YouTube Transcript Flow] Extracted Video ID: ${videoId}`);

      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcript || transcript.length === 0) {
        return { videoId, error: 'No transcript found for this video, or it might be disabled.' };
      }

      const transcriptText = transcript.map(item => item.text).join(' ');
      console.log(`[YouTube Transcript Flow] Fetched transcript for Video ID ${videoId}, length: ${transcriptText.length}`);
      return { transcriptText, videoId };

    } catch (error: any) {
      console.error(`[YouTube Transcript Flow] Error processing YouTube URL ${input.youtubeUrl} (Video ID: ${videoId || 'unknown'}):`, error);
      let errorMessage = 'Failed to fetch transcript.';
      if (error.message && error.message.toLowerCase().includes('transcripts disabled')) {
        errorMessage = 'Transcripts are disabled for this video.';
      } else if (error.message && error.message.toLowerCase().includes('no transcript found')) {
        errorMessage = 'No transcript could be found for this video.';
      } else if (error.message) {
        errorMessage = `Error fetching transcript: ${error.message.substring(0,150)}`;
      }
      return { videoId, error: errorMessage };
    }
  }
);
