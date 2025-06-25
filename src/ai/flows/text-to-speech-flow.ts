
'use server';
/**
 * @fileOverview A robust, hybrid flow for generating speech from text.
 * It prioritizes user-provided Google AI API keys for unlimited generation
 * and falls back to a rate-limited system key for trial usage.
 *
 * - generateSpeech - Generates spoken audio from text and returns it as a Data URI.
 */
import { genkit, type Genkit } from 'genkit';
import { googleAI, type GoogleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit';
import type { GenerateSpeechInput, GenerateSpeechOutput, UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import wav from 'wav';

const FREE_TIER_CREDIT_LIMIT = 15; // Daily TTS generations on the system key

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
  const { text, agentId, userId, voiceName } = input;
  const timestamp = new Date().toISOString();

  let activeGenkitInstance: Genkit<[GoogleAI]>;
  let usingUserKey = false;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error(`User profile not found for ID: ${userId}. Cannot determine API key strategy.`);
    }

    const userProfile = userSnap.data() as UserProfile;
    
    if (userProfile.googleApiKey) {
      console.log(`[${timestamp}] [TTS Flow] Using user-provided Google API Key for user ${userId}.`);
      activeGenkitInstance = genkit({ plugins: [googleAI({ apiKey: userProfile.googleApiKey })] });
      usingUserKey = true;
    } else {
      console.log(`[${timestamp}] [TTS Flow] No user key found. Using system key for user ${userId}.`);
      const creditsUsed = userProfile.ttsCreditsUsed || 0;
      if (creditsUsed >= FREE_TIER_CREDIT_LIMIT) {
        throw new Error(`Daily free tier limit of ${FREE_TIER_CREDIT_LIMIT} TTS generations reached. Please add your own Google AI API Key in Settings for unlimited use.`);
      }
      activeGenkitInstance = ai; // Use the global, system-configured instance
    }

    const selectedVoice = voiceName && voiceName !== 'default' ? voiceName : 'Algenib';
    console.log(`[${timestamp}] [TTS Flow] Request for agent ${agentId}. Voice: ${selectedVoice}.`);

    const { media } = await activeGenkitInstance.generate({
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

    // Increment free tier usage counter if applicable
    if (!usingUserKey) {
        await updateDoc(userRef, {
            ttsCreditsUsed: increment(1)
        });
        console.log(`[${timestamp}] [TTS Flow] Incremented free tier usage for user ${userId}.`);
    }

    const pcmBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWavBase64(pcmBuffer);
    const dataUri = `data:audio/wav;base64,${wavBase64}`;
    
    console.log(`[${timestamp}] [TTS Flow] Speech generated as Data URI for agent ${agentId}.`);
    
    return { audioUrl: dataUri };

  } catch (error: any) {
    console.error(`[${timestamp}] [TTS Flow] Error during speech generation for user ${userId} / agent ${agentId}:`, error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
