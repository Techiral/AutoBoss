
'use server';
/**
 * @fileOverview A simplified flow for generating speech from text using a configured voice.
 * This flow is designed to be stateless and relies on provided API keys and voice IDs.
 *
 * - generateSpeech - Generates spoken audio from text.
 */

import { storage } from '@/lib/firebase';
import type { GenerateSpeechInput, GenerateSpeechOutput } from '@/lib/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  const { text, agentId, voiceId } = input;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [TTS Flow] Received request for agent ${agentId}.`);

  const apiKeyToUse = process.env.ELEVENLABS_API_KEY;

  if (!apiKeyToUse) {
    console.error(`[${timestamp}] [TTS Flow] System-wide ElevenLabs API key (ELEVENLABS_API_KEY) is not configured in environment variables.`);
    throw new Error("Text-to-speech service is not configured by the administrator.");
  }
  
  const effectiveVoiceId = voiceId || 'Rachel'; // Default voice
  const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${effectiveVoiceId}`;
  
  console.log(`[${timestamp}] [TTS Flow] Generating speech with voice: ${effectiveVoiceId}`);

  try {
    const response = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKeyToUse,
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[${timestamp}] [TTS Flow] ElevenLabs API error for agent ${agentId}: Status ${response.status}`, errorBody);
        let userMessage = `Failed to generate speech. Status: ${response.status}.`;
        if (response.status === 401) {
            userMessage = 'The provided system-wide ElevenLabs API key is invalid or expired. Please check server configuration.';
        }
        throw new Error(userMessage);
    }
    
    const audioBuffer = await response.arrayBuffer();
    const content = Buffer.from(audioBuffer);
    
    const storageRef = ref(storage, `tts-audio/${agentId}-${Date.now()}.mp3`);
    await uploadBytes(storageRef, content, { contentType: 'audio/mpeg' });
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log(`[${timestamp}] [TTS Flow] Speech generated and uploaded for agent ${agentId}. URL: ${downloadURL}`);
    return { audioUrl: downloadURL };

  } catch (error: any) {
    console.error(`[${timestamp}] [TTS Flow] Error during ElevenLabs API call or storage upload for agent ${agentId}:`, error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
