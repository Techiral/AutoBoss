
'use server';
/**
 * @fileOverview A simplified flow for generating speech from text using Genkit and Google's TTS model.
 *
 * - generateSpeech - Generates spoken audio from text, stores it, and returns a public URL.
 */
import { storage } from '@/lib/firebase';
import type { GenerateSpeechInput, GenerateSpeechOutput } from '@/lib/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<Buffer> {
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
      resolve(Buffer.concat(bufs));
    });

    writer.write(pcmData);
    writer.end();
  });
}


export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  const { text, agentId, voiceId } = input; // voiceId is unused with Gemini but kept for signature compatibility
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [Gemini TTS Flow] Received request for agent ${agentId}.`);

  try {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Using a default prebuilt voice. Voice selection could be expanded later.
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });

    if (!media || !media.url) {
        throw new Error('AI model did not return any audio media.');
    }

    // The data URI contains base64 encoded raw PCM audio data.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // Convert the raw PCM data to a valid WAV file buffer.
    const wavBuffer = await toWav(audioBuffer);

    // Upload the WAV buffer to Firebase Storage.
    const storageRef = ref(storage, `tts-audio/${agentId}-${Date.now()}.wav`);
    await uploadBytes(storageRef, wavBuffer, { contentType: 'audio/wav' });
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log(`[${timestamp}] [Gemini TTS Flow] Speech generated and uploaded for agent ${agentId}. URL: ${downloadURL}`);
    
    return { audioUrl: downloadURL };

  } catch (error: any) {
    console.error(`[${timestamp}] [Gemini TTS Flow] Error during Gemini TTS call or storage upload for agent ${agentId}:`, error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
