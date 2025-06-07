
'use server';

/**
 * @fileOverview Agent creation flow.
 *
 * - createAgent - A function that handles the agent creation process.
 * - CreateAgentInput - The input type for the createAgent function.
 * - CreateAgentOutput - The return type for the createAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateAgentInputSchema = z.object({
  agentDescription: z
    .string()
    .describe('A description of the agent, including its role and personality.'),
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

Description: {{{agentDescription}}}

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
    const modelResponse = await prompt(input); // `prompt` is the object from ai.definePrompt

    if (!modelResponse.output) {
      const rawText = modelResponse.response?.text; // For debugging
      console.error(
        'Failed to get structured output from createAgentPrompt. Raw model response:',
        rawText || 'No raw text available'
      );
      throw new Error(
        'AI agent could not generate valid details. The model did not return the expected JSON format.'
      );
    }
    // modelResponse.output is already parsed by Genkit according to CreateAgentOutputSchema
    return modelResponse.output;
  }
);
