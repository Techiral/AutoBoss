
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSpeech } from '@/ai/flows/text-to-speech-flow';
import { GenerateSpeechInputSchema } from '@/lib/types';

const createErrorResponse = (status: number, message: string, details?: any) => {
  console.error(`API Error Response (TTS/${status}): ${message}`, details || '');
  return NextResponse.json(
    {
      error: {
        code: status,
        message: message,
        details: details,
      },
    },
    { status }
  );
};

export async function POST(request: NextRequest) {
  let requestBody;
  try {
    const rawBody = await request.json();
    requestBody = GenerateSpeechInputSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, "Invalid request body for TTS.", { issues: error.errors });
    }
    return createErrorResponse(400, "Malformed JSON in request body for TTS.");
  }

  try {
    const { text, agentId } = requestBody;
    console.log(`API Route (TTS): Received request for agent ${agentId}.`);

    const result = await generateSpeech({ text, agentId });

    return NextResponse.json({
      audioUrl: result.audioUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API Route (TTS): Unhandled error | Error:`, error.message, error.stack);
    if (error.message.includes("not found")) {
        return createErrorResponse(404, error.message);
    }
    return createErrorResponse(500, 'An unexpected error occurred while generating speech.', { internalError: error.message });
  }
}
