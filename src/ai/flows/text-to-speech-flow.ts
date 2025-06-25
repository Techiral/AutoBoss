
'use server';
/**
 * @fileOverview A Genkit flow for generating speech from text using an agent's specific voice settings, with credit system.
 *
 * - generateSpeech - Generates spoken audio from text.
 */

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import type { Agent, UserProfile, GenerateSpeechInput, GenerateSpeechOutput } from '@/lib/types';
import { ElevenLabsClient } from 'elevenlabs-node';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const FREE_TIER_LIMIT = parseInt(process.env.ELEVENLABS_FREE_TIER_CREDIT_LIMIT || '50');

export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  const { text, agentId } = input;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [TTS Flow] Received request for agent ${agentId}.`);

  const agentRef = doc(db, 'agents', agentId);
  const agentSnap = await getDoc(agentRef);

  if (!agentSnap.exists()) {
    throw new Error(`Agent with ID '${agentId}' not found.`);
  }

  const agent = agentSnap.data() as Agent;
  const userRef = doc(db, 'users', agent.userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error(`User profile for agent owner '${agent.userId}' not found.`);
  }
  const userProfile = userSnap.data() as UserProfile;

  let apiKeyToUse: string | undefined | null = userProfile.elevenLabsApiKey;
  let usingSystemKey = false;

  if (apiKeyToUse) {
    console.log(`[${timestamp}] [TTS Flow] Using user-provided ElevenLabs API key for agent ${agentId}.`);
  } else {
    apiKeyToUse = process.env.ELEVENLABS_API_KEY;
    if (!apiKeyToUse) {
      console.error(`[${timestamp}] [TTS Flow] System-wide ElevenLabs API key is not configured.`);
      throw new Error("Text-to-speech service is not configured by the administrator. Please add your own ElevenLabs API key in settings.");
    }
    
    console.log(`[${timestamp}] [TTS Flow] User does not have own key. Using system key for agent ${agentId}.`);
    const creditsUsed = userProfile.elevenLabsCreditsUsed || 0;
    if (creditsUsed >= FREE_TIER_LIMIT) {
      console.warn(`[${timestamp}] [TTS Flow] User ${agent.userId} has reached free tier limit.`);
      throw new Error(`You have reached the free tier limit of ${FREE_TIER_LIMIT} voice generations. Please add your own ElevenLabs API key in your settings for unlimited usage.`);
    }
    usingSystemKey = true;
    console.log(`[${timestamp}] [TTS Flow] User ${agent.userId} has ${creditsUsed}/${FREE_TIER_LIMIT} credits used. Proceeding with system key.`);
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey: apiKeyToUse! });
    const audio = await elevenlabs.generate({
      voice: agent.elevenLabsVoiceId || 'Rachel', // Use specified voice or a default
      text,
      model_id: 'eleven_multilingual_v2',
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);
    
    const storageRef = ref(storage, `tts-audio/${agentId}-${Date.now()}.mp3`);
    await uploadBytes(storageRef, content, { contentType: 'audio/mpeg' });
    const downloadURL = await getDownloadURL(storageRef);

    if (usingSystemKey) {
      await setDoc(userRef, { elevenLabsCreditsUsed: increment(1) }, { merge: true });
      console.log(`[${timestamp}] [TTS Flow] Incremented credit usage for user ${agent.userId}.`);
    }
    
    console.log(`[${timestamp}] [TTS Flow] Speech generated and uploaded for agent ${agentId}. URL: ${downloadURL}`);
    return { audioUrl: downloadURL };

  } catch (error: any) {
    console.error(`[${timestamp}] [TTS Flow] Error during ElevenLabs API call or storage upload for agent ${agentId}:`, error);
    // Provide a more user-friendly error for common API issues
    if (error.message && (error.message.includes('401') || error.message.toLowerCase().includes('invalid api key'))) {
       throw new Error('The provided ElevenLabs API Key is invalid or expired. Please check your settings.');
    }
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
