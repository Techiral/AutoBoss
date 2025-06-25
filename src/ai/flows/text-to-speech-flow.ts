'use server';
/**
 * @fileOverview A simple, robust flow for generating speech from text.
 * This flow uses a single system-wide API key and does not access the database,
 * making it more reliable and immune to permission errors.
 *
 * - generateSpeech - Generates spoken audio from text and returns it as a Data URI.
 */
import { ai } from '@/ai/genkit';
import type { GenerateSpeechInput, GenerateSpeechOutput } from '@/lib/types';
import wav from 'wav';

async function toWavBase64(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  const { text, voiceName } = input;
  const timestamp = new Date().toISOString();

  try {
    const selectedVoice = voiceName && voiceName !== 'default' ? voiceName : 'Algenib';
    console.log(`[${timestamp}] [TTS Flow] Generating speech. Voice: ${selectedVoice}.`);

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
      prompt: text,
    });

    if (!media || !media.url) {
      throw new Error('AI model did not return any audio media.');
    }

    // Convert the raw PCM audio data from Google to a standard WAV format.
    // This ensures maximum browser compatibility.
    const pcmBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWavBase64(pcmBuffer);
    const dataUri = `data:audio/wav;base64,${wavBase64}`;
    
    console.log(`[${timestamp}] [TTS Flow] Speech generated successfully as Data URI.`);
    
    return { audioUrl: dataUri };

  } catch (error: any) {
    console.error(`[${timestamp}] [TTS Flow] Error during speech generation:`, error);
    if (error.message && error.message.includes('429 Too Many Requests')) {
       throw new Error('The speech generation service is currently experiencing high demand (Rate Limit Exceeded). If you are the app owner, please check your Google Cloud project plan and billing details.');
    }
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
