
import { config } from 'dotenv';
config();

import '@/ai/flows/knowledge-extraction.ts';
import '@/ai/flows/autonomous-reasoning.ts';
import '@/ai/flows/agent-creation.ts';
import '@/ai/flows/url-processor.ts';
import '@/ai/flows/voice-response-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts';
import '@/ai/flows/image-generation-flow.ts';
