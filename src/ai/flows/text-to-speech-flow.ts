
'use server';
/**
 * @fileOverview A simplified flow for generating speech from text using Genkit and Google's TTS model.
 * This version generates a Data URI to be used directly in a web client, bypassing Firebase Storage.
 *
 * - generateSpeech - Generates spoken audio from text and returns it as a Data URI.
 */
import type { GenerateSpeechInput, GenerateSpeechOutput } from '@/lib/types';
import { ai } from '@/ai/genkit';
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
  const { text, agentId, voiceName } = input;
  const timestamp = new Date().toISOString();

  // Use the selected voice or a high-quality default.
  const selectedVoice = voiceName && voiceName !== 'default' ? voiceName : 'Algenib'; 
  console.log(`[${timestamp}] [Gemini TTS Flow] Received request for agent ${agentId}. Voice: ${selectedVoice}. Generating Data URI.`);

  try {
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

    // The data URI from Genkit contains base64 encoded raw PCM audio data.
    const pcmBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // Convert the raw PCM data to a valid WAV file buffer, then to Base64.
    const wavBase64 = await toWavBase64(pcmBuffer);
    const dataUri = `data:audio/wav;base64,${wavBase64}`;
    
    console.log(`[${timestamp}] [Gemini TTS Flow] Speech generated as Data URI for agent ${agentId}.`);
    
    return { audioUrl: dataUri };

  } catch (error: any) {
    console.error(`[${timestamp}] [Gemini TTS Flow] Error during Gemini TTS call or WAV conversion for agent ${agentId}:`, error);
    // Rewrap the error to ensure a clear message is propagated.
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
