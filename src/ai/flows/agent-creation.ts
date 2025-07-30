
'use server';

/**
 * @fileOverview Agent creation flow that intelligently interprets a user's natural language prompt.
 *
 * - createAgentFromPrompt - A function that takes a prompt and generates a complete agent configuration.
 * - CreateAgentFromPromptInput - The input type for the function.
 * - AgentCreationOutput - The return type for the function, containing all necessary fields for a new agent.
 */

import {ai} from '@/ai/genkit';
import {
    CreateAgentFromPromptInputSchema, 
    AgentCreationOutputSchema, 
    type CreateAgentFromPromptInput, 
    type AgentCreationOutput 
} from '@/lib/types';


export async function createAgentFromPrompt(input: CreateAgentFromPromptInput): Promise<AgentCreationOutput> {
  return createAgentFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createAgentFromPrompt',
  input: {schema: CreateAgentFromPromptInputSchema},
  output: {schema: AgentCreationOutputSchema},
  prompt: `You are an expert in creating AI agents based on user requests. A user has provided the following prompt. Your task is to analyze it and generate a complete, structured configuration for the new agent.

--- USER PROMPT ---
"{{{prompt}}}"
--- END USER PROMPT ---

--- CONTEXTUAL HINTS ---
- User wants this agent to be public: {{{isPubliclyShared}}}. Your 'isPubliclyShared' output must reflect this.
- User has attached a knowledge source: {{{hasKnowledge}}}. This is a strong hint that the agent's primaryLogic should be 'rag' (Retrieval-Augmented Generation) so it can answer questions based on that knowledge. If 'hasKnowledge' is false, and the prompt seems more about general conversation or creative tasks, use 'prompt' as the primaryLogic.
{{#if existingClientNames}}
- The user already has clients named: {{#each existingClientNames}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.
  - If the prompt mentions a company name that closely matches one of these, you MUST use the exact existing name for the 'clientName' output field.
  - If the prompt mentions a new company name not in this list, use that new name for 'clientName'.
  - If the prompt does NOT mention any specific client or company, you MUST omit the 'clientName' field entirely.
{{else}}
- The user has no existing clients. If the prompt mentions a company name, use that for the 'clientName' field. Otherwise, omit it.
{{/if}}
--- END CONTEXTUAL HINTS ---

Based on all the information, generate the following fields:

1.  **name**: A short, internal-facing name for the agent concept (e.g., 'ACME Support Bot'). This is derived from the prompt.
2.  **description**: A one-sentence description of the agent's purpose.
3.  **role**: A detailed description of the agent's role and objectives, written in the first person as if the agent is describing its job.
4.  **personality**: A detailed description of the agent's personality and communication style.
5.  **generatedName**: A creative, catchy, user-facing name for the agent.
6.  **generatedPersona**: A detailed persona of the agent based on the description, written in the first person.
7.  **generatedGreeting**: A sample greeting from the agent that aligns with its persona and role.
8.  **agentType**: Infer if it's 'chat', 'voice', or 'hybrid'. Default to 'chat' if unclear.
9.  **direction**: Infer if it's 'inbound' or 'outbound'. Default to 'inbound'.
10. **agentTone**: Infer the tone ('friendly', 'professional', 'witty', 'neutral'). Default to 'friendly' if the prompt is casual.
11. **primaryLogic**: MUST be 'rag' if the agent's purpose is to answer questions from data OR if 'hasKnowledge' is true. Otherwise, 'prompt'.
12. **isPubliclyShared**: Set based on the user's preference.
13. **clientName**: Set ONLY if a client/company name is mentioned in the prompt. Match existing names if possible.

Your response MUST be a single, valid JSON object that strictly adheres to the output schema.
`,
});

const createAgentFromPromptFlow = ai.defineFlow(
  {
    name: 'createAgentFromPromptFlow',
    inputSchema: CreateAgentFromPromptInputSchema,
    outputSchema: AgentCreationOutputSchema,
  },
  async (input): Promise<AgentCreationOutput> => {
    
    const modelResponse = await prompt(input); 

    if (!modelResponse.output) {
      const rawText = modelResponse.response?.text; 
      console.error(
        'Failed to get structured output from createAgentFromPrompt. Raw model response:',
        rawText || 'No raw text available'
      );
      // Attempt to parse raw text as a fallback
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          const validation = AgentCreationOutputSchema.safeParse(parsed);
          if (validation.success) {
            console.warn("Successfully parsed raw text as fallback agent creation output.");
            return validation.data;
          }
        } catch (e) {
          // Fall through to the main error
        }
      }
      throw new Error(
        'AI agent could not generate valid details. The model did not return the expected JSON format.'
      );
    }
    return modelResponse.output;
  }
);
    
