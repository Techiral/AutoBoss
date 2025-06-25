'use server';
/**
 * @fileOverview A flow for generating speech from text using a custom third-party provider.
 * This flow reads multiple API keys from environment variables and rotates them
 * to manage rate limits.
 *
 * - generateSpeech - Generates spoken audio from text and returns it as a Data URI.
 */
import type { GenerateSpeechInput, GenerateSpeechOutput } from '@/lib/types';

// --- API Key Rotation Logic ---
const apiKeys: string[] = [];
// On module load, read all A4F_API_KEY_... keys from environment variables
Object.keys(process.env).forEach(key => {
  if (key.startsWith('A4F_API_KEY_')) {
    const apiKey = process.env[key];
    if (apiKey) {
      apiKeys.push(apiKey);
    }
  }
});
if (apiKeys.length > 0) {
    console.log(`[TTS Flow] Loaded ${apiKeys.length} API keys for rotation.`);
}

let currentKeyIndex = 0;
let requestCount = 0;

function getNextApiKey() {
  if (apiKeys.length === 0) {
    return null;
  }

  // This logic rotates the key after every 2 requests.
  requestCount++;
  if (requestCount > 2) {
    requestCount = 1;
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`[TTS Flow] Rotating to API Key index: ${currentKeyIndex}`);
  }

  return apiKeys[currentKeyIndex];
}
// --- End API Key Rotation Logic ---


export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  const { text } = input;
  const timestamp = new Date().toISOString();

  const apiKey = getNextApiKey();
  if (!apiKey) {
    console.error(`[${timestamp}] [TTS Flow] Error: No A4F_API_KEY environment variables found. Please add them to your .env file in the format A4F_API_KEY_1, A4F_API_KEY_2, etc.`);
    throw new Error('TTS service is not configured. API keys are missing in .env file.');
  }

  console.log(`[${timestamp}] [TTS Flow] Generating speech using custom provider. Key Index: ${currentKeyIndex}`);

  try {
    const response = await fetch("https://api.a4f.co/v1/audio/speech", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // Using a standard high-quality TTS model instead of a chat model to fix 404 error.
        input: text,
        voice: 'nova', // Using 'nova' as a high-quality default voice from the standard OpenAI TTS options
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${timestamp}] [TTS Flow] Error from custom provider API. Status: ${response.status}. Body: ${errorBody}`);
      throw new Error(`Failed to generate speech from custom provider. Status: ${response.status}. Check the model name or API key.`);
    }

    // The API returns the raw audio data. Convert it to a Base64 Data URI.
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const dataUri = `data:audio/mpeg;base64,${base64Audio}`;

    console.log(`[${timestamp}] [TTS Flow] Speech generated successfully from custom provider.`);
    return { audioUrl: dataUri };

  } catch (error: any) {
    console.error(`[${timestamp}] [TTS Flow] Critical error during custom speech generation:`, error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
