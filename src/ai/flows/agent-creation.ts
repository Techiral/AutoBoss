
'use server';

/**
 * @fileOverview Agent creation flow.
 *
 * - createAgent - A function that handles the agent creation process.
 * - CreateAgentInput - The input type for the createAgent function.
 * - CreateAgentOutput - The return type for the createAgent function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import type { AgentType, AgentDirection } from '@/lib/types';

const CreateAgentInputSchema = z.object({
  agentDescription: z
    .string()
    .describe('A description of the agent, including its role and personality.'),
  agentType: z.custom<AgentType>().optional().describe("The type of agent: 'chat', 'voice', or 'hybrid'. This can influence the generated persona and greeting."),
  direction: z.custom<AgentDirection>().optional().describe("The direction of the agent: 'inbound' or 'outbound'. This can influence tone or initial greeting strategy.")
});
export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

const CreateAgentOutputSchema = z.object({
  agentName: z.string().describe('The generated name of the agent.'),
  agentPersona: z
    .string()
    .describe('A more detailed persona of the agent based on the description.'),
  agentGreeting: z.string().describe('A sample greeting from the agent.'),
});
export type CreateAgentOutput = z.infer<typeof CreateAgentOutputSchema>;

export async function createAgent(input: CreateAgentInput): Promise<CreateAgentOutput> {
  return createAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createAgentPrompt',
  input: {schema: CreateAgentInputSchema},
  output: {schema: CreateAgentOutputSchema}, // This tells Genkit to expect JSON and parse it.
  prompt: `You are an expert in creating AI agents. Based on the description provided, you will generate:
1. A concise and catchy "agentName".
2. A detailed "agentPersona" in the first person, embodying the role and personality.
3. A sample "agentGreeting" that the agent would use to introduce itself.

{{#if agentType}}
The agent is intended to be a "{{agentType}}" agent.
{{#if direction}}
It is also an "{{direction}}" agent.
{{/if}}
Consider these characteristics when crafting the persona and greeting.
For example:
- A 'voice' agent's greeting should be natural and concise for a phone call (e.g., "Hello, this is [Agent Name], how can I help you?").
- An 'inbound' chat agent might have a welcoming greeting for a website visitor (e.g., "Hi there! I'm [Agent Name], your virtual assistant for [Business]. How can I assist you today?").
- An 'outbound' agent might have a more direct but polite opening if initiating contact (though full outbound logic is complex, its initial greeting tone can be considered).
- A 'hybrid' agent should have a versatile greeting.
This agent will primarily rely on its persona, direct AI prompting, and any trained knowledge (RAG), not a predefined visual flow.
{{/if}}

Description:
{{{agentDescription}}}

Your response MUST be a single, valid JSON object that adheres to the output schema.
Specifically, it should have the fields: "agentName", "agentPersona", and "agentGreeting".
Example format:
{
  "agentName": "Example Agent",
  "agentPersona": "I am the Example Agent, here to assist you with...",
  "agentGreeting": "Hello, I'm Example Agent, ready to help!"
}`,
});

const createAgentFlow = ai.defineFlow(
  {
    name: 'createAgentFlow',
    inputSchema: CreateAgentInputSchema,
    outputSchema: CreateAgentOutputSchema,
  },
  async (input): Promise<CreateAgentOutput> => {
    const modelResponse = await prompt(input); 

    if (!modelResponse.output) {
      const rawText = modelResponse.response?.text; 
      console.error(
        'Failed to get structured output from createAgentPrompt. Raw model response:',
        rawText || 'No raw text available'
      );
      throw new Error(
        'AI agent could not generate valid details. The model did not return the expected JSON format.'
      );
    }
    return modelResponse.output;
  }
);
    