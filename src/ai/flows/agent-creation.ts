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
  output: {schema: CreateAgentOutputSchema},
  prompt: `You are an expert in creating AI agents. Based on the description provided, you will generate a name, a detailed persona, and a sample greeting for the agent. The agent persona must be detailed and in first person.

Description: {{{agentDescription}}}

Name:
Persona:
Greeting:`, // Removed Handlebars 'return' statement and return all three as a single output.
});

const createAgentFlow = ai.defineFlow(
  {
    name: 'createAgentFlow',
    inputSchema: CreateAgentInputSchema,
    outputSchema: CreateAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Since the model returns a single block, we need to split it into its three output components.
    const outputSplit = output!.text.split('\n');
    return {
      agentName: outputSplit[0].replace('Name:', '').trim(),
      agentPersona: outputSplit[1].replace('Persona:', '').trim(),
      agentGreeting: outputSplit[2].replace('Greeting:', '').trim(),
    };
  }
);
