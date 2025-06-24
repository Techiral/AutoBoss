
'use server';
/**
 * @fileOverview A Genkit flow for generating speech from text using an agent's specific voice settings.
 *
 * - generateSpeech - Generates spoken audio from text.
 * - GenerateSpeechInput - Input schema for the flow.
 * - GenerateSpeechOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent, UserProfile } from '@/lib/types';
import { ElevenLabsClient } from 'elevenlabs-node';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

// Input schema for the text-to-speech flow
export const GenerateSpeechInputSchema = z.object({
  text: z.string().min(1, 'Text to speak cannot be empty.'),
  agentId: z.string().min(1, 'Agent ID is required to determine the voice.'),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

// Output schema for the text-to-speech flow
export const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().url().describe('A public URL to the generated MP3 audio file.'),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;


export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  return generateSpeechFlow(input);
}


async function generateElevenLabsSpeech(text: string, userId: string, agentId: string, voiceId?: string | null): Promise<string | null> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [TTS Service] Generating speech for agent ${agentId}`);
  let apiKey: string | undefined | null;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        apiKey = userData.elevenLabsApiKey;
    }
  } catch (error) {
    console.error(`[${timestamp}] [TTS Service] Error fetching user profile for API key for agent ${agentId}:`, error);
  }

  if (!apiKey) {
    apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      console.log(`[${timestamp}] [TTS Service] Using system default ElevenLabs API key for agent ${agentId}.`);
    }
  } else {
     console.log(`[${timestamp}] [TTS Service] Using user-specific ElevenLabs API key for agent ${agentId}.`);
  }

  if (!apiKey) {
    console.warn(`[${timestamp}] [TTS Service] No ElevenLabs API key found (user or system) for agent ${agentId}. Cannot generate speech.`);
    return null;
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const audio = await elevenlabs.generate({
        voice: voiceId || 'Rachel', // Use specified voice or a default
        text,
        model_id: 'eleven_multilingual_v2',
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
        chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);
    
    console.log(`[${timestamp}] [TTS Service] Speech audio generated successfully for agent ${agentId}. Uploading to storage.`);
    const storageRef = ref(storage, `tts-audio/${agentId}-${Date.now()}.mp3`);
    const uploadResult = await uploadBytes(storageRef, content, { contentType: 'audio/mpeg' });
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log(`[${timestamp}] [TTS Service] Audio uploaded for agent ${agentId}. Public URL: ${downloadURL}`);
    return downloadURL;

  } catch (error) {
    console.error(`[${timestamp}] [TTS Service] Error during ElevenLabs API call or storage upload for agent ${agentId}:`, error);
    return null;
  }
}

async function generateGoogleSpeech(text: string, agentId: string): Promise<string | null> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [TTS Service - Google] Generating speech for agent ${agentId}`);
    try {
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Algenib' },
                    },
                },
            },
            prompt: text,
        });

        if (!media) {
            throw new Error('No media returned from Google TTS.');
        }

        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);
        const wavDataUri = `data:audio/wav;base64,${wavBase64}`;

        console.log(`[${timestamp}] [TTS Service - Google] Speech audio generated successfully for agent ${agentId}. Uploading to storage.`);
        const storageRef = ref(storage, `tts-audio/${agentId}-${Date.now()}.wav`);
        
        // Convert data URI to buffer for upload
        const uploadBuffer = Buffer.from(wavBase64, 'base64');
        const uploadResult = await uploadBytes(storageRef, uploadBuffer, { contentType: 'audio/wav' });
        const downloadURL = await getDownloadURL(uploadResult.ref);

        console.log(`[${timestamp}] [TTS Service - Google] Audio uploaded for agent ${agentId}. Public URL: ${downloadURL}`);
        return downloadURL;

    } catch (error) {
        console.error(`[${timestamp}] [TTS Service - Google] Error during Google TTS generation or storage upload for agent ${agentId}:`, error);
        return null;
    }
}


const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: GenerateSpeechInputSchema,
    outputSchema: GenerateSpeechOutputSchema,
  },
  async ({ text, agentId }) => {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      throw new Error(`Agent with ID '${agentId}' not found.`);
    }

    const agent = agentSnap.data() as Agent;

    let audioUrl: string | null = null;
    
    // Prioritize ElevenLabs if configured
    if (agent.elevenLabsVoiceId) {
      console.log(`Flow: Agent ${agentId} has ElevenLabs voice ID. Attempting to generate speech with ElevenLabs.`);
      audioUrl = await generateElevenLabsSpeech(text, agent.userId, agentId, agent.elevenLabsVoiceId);
    }

    // If ElevenLabs fails or is not configured, fall back to Google's TTS
    if (!audioUrl) {
      console.log(`Flow: ElevenLabs speech generation failed or not configured for agent ${agentId}. Falling back to Google TTS.`);
      audioUrl = await generateGoogleSpeech(text, agentId);
    }
    
    if (!audioUrl) {
      throw new Error('Failed to generate speech using all available TTS providers.');
    }

    return { audioUrl };
  }
);


// Helper function to convert PCM data to WAV format
async function toWav(
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

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
