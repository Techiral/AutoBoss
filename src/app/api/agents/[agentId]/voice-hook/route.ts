
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent, UserProfile, AgentToneType } from '@/lib/types';
import { generateVoiceResponse, VoiceResponseInput } from '@/ai/flows/voice-response-flow';
import { ElevenLabsClient } from 'elevenlabs-node';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_HISTORY_ITEMS_IN_URL = 2; // Number of recent exchanges (1 user + 1 agent) = 4 items total (u1,a1,u2,a2)

// Helper to convert Firestore Timestamps in agent data
const convertAgentDataForVoice = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.knowledgeItems) {
    newAgent.knowledgeItems = newAgent.knowledgeItems.map((item: any) => {
      if (item.uploadedAt && item.uploadedAt.toDate) {
        return { ...item, uploadedAt: item.uploadedAt.toDate().toISOString() };
      }
      return item;
    });
  }
  return newAgent as Agent;
};

async function generateElevenLabsSpeech(text: string, userId: string, callSid: string, voiceId?: string | null): Promise<string | null> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [TTS Service] Generating speech for call ${callSid}`);
  let apiKey: string | undefined | null;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        apiKey = userData.elevenLabsApiKey;
    }
  } catch (error) {
    console.error(`[${timestamp}] [TTS Service] Error fetching user profile for API key for call ${callSid}:`, error);
  }

  if (!apiKey) {
    apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      console.log(`[${timestamp}] [TTS Service] Using system default ElevenLabs API key for call ${callSid}.`);
    }
  } else {
     console.log(`[${timestamp}] [TTS Service] Using user-specific ElevenLabs API key for call ${callSid}.`);
  }

  if (!apiKey) {
    console.warn(`[${timestamp}] [TTS Service] No ElevenLabs API key found (user or system) for call ${callSid}. Cannot generate speech.`);
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
    
    console.log(`[${timestamp}] [TTS Service] Speech audio generated successfully for call ${callSid}. Uploading to storage.`);
    const storageRef = ref(storage, `voice-responses/${callSid}-${Date.now()}.mp3`);
    const uploadResult = await uploadBytes(storageRef, content, { contentType: 'audio/mpeg' });
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log(`[${timestamp}] [TTS Service] Audio uploaded for call ${callSid}. Public URL: ${downloadURL}`);
    return downloadURL;

  } catch (error) {
    console.error(`[${timestamp}] [TTS Service] Error during ElevenLabs API call or storage upload for call ${callSid}:`, error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio Voice Hook POST for Agent ID: ${agentId}`);

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const requestBody = await request.formData();
    const twilioData = Object.fromEntries(requestBody.entries());
    const searchParams = request.nextUrl.searchParams;

    console.log(`[${timestamp}] Twilio Request Data for ${agentId}:`, JSON.stringify(twilioData));

    const speechResult = twilioData.SpeechResult as string | undefined;
    const callSid = twilioData.CallSid as string;

    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      console.warn(`[${timestamp}] Agent ${agentId} not found in Firestore.`);
      twiml.say({ voice: 'alice' }, `Sorry, the requested agent could not be found.`);
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'application/xml' } });
    }
    
    const agent = convertAgentDataForVoice({ id: agentSnap.id, ...agentSnap.data() });
    let agentResponseText = agent.generatedGreeting || `Hello, you've reached ${agent.generatedName || agent.name}. How can I help?`;
    
    const shortHistoryFromUrl: string[] = [];
    for(let i = 1; i <= MAX_HISTORY_ITEMS_IN_URL; i++) {
        const userMsg = searchParams.get(`u${i}`);
        const agentMsg = searchParams.get(`a${i}`);
        if (userMsg) shortHistoryFromUrl.push(`User: ${userMsg}`);
        if (agentMsg) shortHistoryFromUrl.push(`Agent: ${agentMsg}`);
    }
    
    let newHistoryForUrlParams: Record<string, string> = {};

    if (speechResult && speechResult.trim()) {
      console.log(`[${timestamp}] User speech for ${callSid} (Agent: ${agent.id}): "${speechResult}"`);
      
      const voiceInput: VoiceResponseInput = {
        userInput: speechResult,
        agentName: agent.generatedName,
        agentPersona: agent.generatedPersona,
        agentRole: agent.role,
        agentTone: agent.agentTone || "neutral",
        shortHistory: shortHistoryFromUrl,
        knowledgeItems: agent.knowledgeItems && agent.primaryLogic === 'rag' ? agent.knowledgeItems : undefined,
      };

      try {
        const llmResponse = await generateVoiceResponse(voiceInput);
        agentResponseText = llmResponse.agentResponse;
        console.log(`[${timestamp}] LLM Voice Response for ${callSid}: "${agentResponseText}"`);
      } catch (flowError: any) {
        console.error(`[${timestamp}] Error calling generateVoiceResponse flow for ${callSid}:`, flowError);
        agentResponseText = "I'm having a little trouble understanding right now. Could you please repeat that?";
      }
      
      const currentTurnHistory = [...shortHistoryFromUrl, `User: ${speechResult}`, `Agent: ${agentResponseText}`];
      const historyToPassOn = currentTurnHistory.slice(-MAX_HISTORY_ITEMS_IN_URL * 2); 
      
      let uIndex = 1, aIndex = 1;
      historyToPassOn.forEach(item => {
          if (item.startsWith("User: ") && uIndex <= MAX_HISTORY_ITEMS_IN_URL) {
              newHistoryForUrlParams[`u${uIndex++}`] = item.substring(6);
          } else if (item.startsWith("Agent: ") && aIndex <= MAX_HISTORY_ITEMS_IN_URL) {
              newHistoryForUrlParams[`a${aIndex++}`] = item.substring(7);
          }
      });

    } else {
      console.log(`[${timestamp}] Initial interaction or empty/timeout speech for ${callSid}. Greeting with: "${agentResponseText}"`);
      if (shortHistoryFromUrl.length > 0) {
        let uIndex = 1, aIndex = 1;
        shortHistoryFromUrl.forEach(item => {
            if (item.startsWith("User: ") && uIndex <= MAX_HISTORY_ITEMS_IN_URL) {
                newHistoryForUrlParams[`u${uIndex++}`] = item.substring(6);
            } else if (item.startsWith("Agent: ") && aIndex <= MAX_HISTORY_ITEMS_IN_URL) {
                newHistoryForUrlParams[`a${aIndex++}`] = item.substring(7);
            }
        });
      } else {
         newHistoryForUrlParams['a1'] = agentResponseText;
      }
    }
    
    // Generate speech with ElevenLabs
    const audioUrl = await generateElevenLabsSpeech(agentResponseText, agent.userId, callSid, agent.elevenLabsVoiceId);

    if (audioUrl) {
      twiml.play(audioUrl);
    } else {
      // Fallback to standard Twilio voice if ElevenLabs fails
      console.warn(`[${timestamp}] Fallback to Twilio TTS for call ${callSid} as ElevenLabs failed.`);
      twiml.say({ voice: 'alice', language: 'en-US' }, agentResponseText);
    }

    const actionUrl = new URL(`/api/agents/${agentId}/voice-hook`, request.nextUrl.origin);
    Object.entries(newHistoryForUrlParams).forEach(([key, value]) => {
        actionUrl.searchParams.set(key, value);
    });
    
    twiml.gather({
      input: 'speech',
      action: actionUrl.pathname + actionUrl.search, 
      speechTimeout: 'auto',
      timeout: 5,
      profanityFilter: true,
      language: 'en-US',
    });

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });

  } catch (error: any) {
    console.error(`[${timestamp}] General error in Twilio Voice Hook for agent ${agentId}:`, error);
    twiml.say({ voice: 'alice' }, 'Sorry, an unexpected error occurred with the voice agent.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
        status: 500,
        headers: { 'Content-Type': 'application/xml' },
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  return NextResponse.json({ 
    message: `This is the AutoBoss Voice Hook for Agent ID: ${agentId}. It's ready to receive POST requests from Twilio.`,
  }, { status: 200 });
}
