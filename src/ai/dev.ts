
import { config } from 'dotenv';
config();

import '@/ai/flows/intent-recognition.ts';
import '@/ai/flows/knowledge-extraction.ts';
import '@/ai/flows/autonomous-reasoning.ts';
import '@/ai/flows/agent-creation.ts';
import '@/ai/flows/url-processor.ts';
import '@/ai/flows/voice-response-flow.ts';
import '@/ai/tools/web-search-tool.ts'; // Added import for the new tool
    
