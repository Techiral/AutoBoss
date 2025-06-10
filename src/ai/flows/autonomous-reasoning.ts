
'use server';

/**
 * @fileOverview A autonomous reasoning AI agent with knowledge base access, enhanced for RAG-like behavior.
 *
 * - autonomousReasoning - A function that handles the autonomous reasoning process.
 * - AutonomousReasoningInput - The input type for the autonomousReasoning function.
 * - AutonomousReasoningOutput - The return type for the autonomousReasoning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { KnowledgeItemSchema, type KnowledgeItem, AgentToneSchema, type AgentToneType } from '@/lib/types'; 
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';


const AutonomousReasoningInputSchema = z.object({
  agentName: z.string().optional().describe("The name of the agent."),
  agentPersona: z.string().optional().describe("The persona of the agent."),
  agentRole: z.string().optional().describe("The role/objective of the agent."),
  agentTone: AgentToneSchema.optional().describe("The desired conversational tone for the agent."),
  context: z.string().describe('The current context of the conversation, including past messages.'),
  userInput: z.string().describe('The user input to analyze and respond to.'),
  knowledgeItems: z.array(KnowledgeItemSchema).optional().describe("An array of knowledge items for the agent. For RAG, these items' summaries will be chunked and indexed."),
});
export type AutonomousReasoningInput = z.infer<typeof AutonomousReasoningInputSchema>;

const AutonomousReasoningOutputSchema = z.object({
  responseToUser: z.string().describe('A direct, conversational reply to the user. If knowledge was used, it cites the source (e.g., "Based on document X...").'),
  reasoning: z.string().describe('The reasoning behind the generated response, including which knowledge items (or chunks) were deemed relevant and used.'),
  relevantKnowledgeIds: z.array(z.string()).optional().describe('IDs of the original knowledge items from which relevant chunks were retrieved.')
});
export type AutonomousReasoningOutput = z.infer<typeof AutonomousReasoningOutputSchema>;

export async function autonomousReasoning(input: AutonomousReasoningInput): Promise<AutonomousReasoningOutput> {
  return autonomousReasoningFlow(input);
}

// Internal schema for the prompt's direct input
const PromptInputSchema = z.object({ 
  agentName: z.string().optional(),
  agentPersona: z.string().optional(),
  agentRole: z.string().optional(),
  agentTone: AgentToneSchema.optional(), // Keep original tone for display in prompt
  isFriendlyTone: z.boolean().optional(),
  isProfessionalTone: z.boolean().optional(),
  isWittyTone: z.boolean().optional(),
  isNeutralTone: z.boolean().optional(),
  context: z.string(),
  userInput: z.string(),
  retrievedChunksText: z.string().optional().describe("Concatenated text of relevant chunks retrieved from the knowledge base."),
});


const prompt = ai.definePrompt({
  name: 'autonomousReasoningPrompt',
  input: {schema: PromptInputSchema }, // Use the extended schema
  output: {schema: AutonomousReasoningOutputSchema},
  prompt: `
{{#if agentTone}}
Your conversational tone MUST be: {{agentTone}}.
  {{#if isFriendlyTone}}
    Adopt a warm, approachable, and casual conversational style. Use friendly language and express positive emotions where appropriate.
  {{else if isProfessionalTone}}
    Maintain a formal, precise, and respectful tone. Use clear, direct language and avoid slang or overly casual expressions.
  {{else if isWittyTone}}
    Incorporate humor, clever wordplay, and a playful attitude. Responses can be lighthearted and engaging, but still relevant.
  {{else}}
    Use a balanced and neutral conversational style.
  {{/if}}
---
{{/if}}

{{#if agentName}}You are {{agentName}}.{{/if}}
{{#if agentPersona}} Your persona is: {{agentPersona}}.{{/if}}
{{#if agentRole}} Your role is: {{agentRole}}.{{else}}You are a helpful and conversational AI assistant.{{/if}}

--- Role-Specific Behavior Guidance ---
Based on your defined 'agentRole' ({{{agentRole}}}), adapt your approach:
If your role is sales-oriented (e.g., involves 'sales', 'lead generation', 'booking demos', 'closing deals'):
1.  Understand Needs: If the user is vague, ask clarifying questions to understand their requirements.
2.  Highlight Value: Based on their needs and your knowledge, explain how the product/service can benefit them.
3.  Address Concerns: If they raise objections (e.g., about price, features), use your knowledge to provide reassuring and factual answers.
4.  Guide to Next Step (Call to Action): If they show interest or ask for it, proactively suggest a relevant next step from your knowledge (e.g., visiting a specific product/pricing page, offering to help schedule a demo, or suggesting they speak with a human sales representative).
Be helpful and persuasive, but not overly aggressive. Your goal is to assist the user and guide them if they are a good fit.
--- End Role-Specific Behavior Guidance ---

Your goal is to understand the user's input within the given conversation context and respond effectively.

Conversation Context (previous messages):
{{{context}}}

User's Latest Input:
{{{userInput}}}

{{#if retrievedChunksText}}
--- Relevant Information from Your Knowledge Base ---
Carefully review the following information retrieved from your knowledge base. This is potentially relevant to the user's query.
{{{retrievedChunksText}}}
--- End Relevant Information from Your Knowledge Base ---

When formulating your "responseToUser", synthesize information from this "Relevant Information" if it helps answer the query.
If you use this information, you can subtly weave it in. For example, instead of "Based on document X...", you might say, "I found some information that might help: ..." or directly answer using the facts.
The "reasoning" field should explicitly mention that retrieved knowledge chunks were used.
{{else}}
You will rely on your general knowledge and the conversation context to answer, as no specific knowledge base information was retrieved for this query.
The "reasoning" field should reflect that general knowledge was used.
{{/if}}

Your response MUST be a single, valid JSON object adhering to the output schema:
{
  "responseToUser": "The conversational reply.",
  "reasoning": "Explanation of how the response was derived, noting if specific knowledge chunks were used or if it was general knowledge.",
  "relevantKnowledgeIds": ["id_of_original_item_for_chunk_1", "id_of_original_item_for_chunk_2"]
}
`,
});

const autonomousReasoningFlow = ai.defineFlow(
  {
    name: 'autonomousReasoningFlow',
    inputSchema: AutonomousReasoningInputSchema, // Flow input is still the original schema
    outputSchema: AutonomousReasoningOutputSchema,
  },
  async (input: AutonomousReasoningInput): Promise<AutonomousReasoningOutput> => {
    let retrievedChunksText: string | undefined = undefined;
    let relevantOriginalItemIds: string[] = [];

    if (input.knowledgeItems && input.knowledgeItems.length > 0 ) {
      console.log(`RAG: Processing ${input.knowledgeItems.length} knowledge items for agent.`);
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const allChunks: Array<{ text: string, originalItemId: string, originalItemFileName: string }> = [];
      const allOriginalItemIds = new Set<string>();

      for (const item of input.knowledgeItems) {
        const sourceText = item.summary || ""; 
        if (!sourceText.trim()) continue;

        const docs = await textSplitter.createDocuments([sourceText]);
        docs.forEach(doc => {
          allChunks.push({
            text: doc.pageContent,
            originalItemId: item.id,
            originalItemFileName: item.fileName,
          });
          allOriginalItemIds.add(item.id);
        });
      }

      if (allChunks.length > 0) {
        console.log(`RAG: Generated ${allChunks.length} chunks. Concatenating all for context.`);
        // Simplified RAG: Concatenate all chunks instead of vector search
        retrievedChunksText = allChunks
          .map(chunk => `Source: ${chunk.originalItemFileName}\nContent:\n${chunk.text}\n---`)
          .join('\n\n');
        relevantOriginalItemIds = Array.from(allOriginalItemIds);
        console.log(`RAG: Passing concatenated text of ${allChunks.length} chunks to LLM. Source IDs: ${relevantOriginalItemIds.join(', ')}`);
      } else {
        console.log("RAG: No text content found in knowledge items to chunk and index.");
      }
    } else {
        console.log("RAG: No knowledge items provided. Skipping RAG processing.");
    }

    const promptInputData: z.infer<typeof PromptInputSchema> = {
      agentName: input.agentName,
      agentPersona: input.agentPersona,
      agentRole: input.agentRole,
      agentTone: input.agentTone, // Pass original tone string for display in prompt
      isFriendlyTone: input.agentTone === 'friendly',
      isProfessionalTone: input.agentTone === 'professional',
      isWittyTone: input.agentTone === 'witty',
      isNeutralTone: input.agentTone === 'neutral' || !input.agentTone,
      context: input.context,
      userInput: input.userInput,
      retrievedChunksText: retrievedChunksText,
    };

    const modelResponse = await prompt(promptInputData); 
    
    if (!modelResponse.output) {
        const rawText = modelResponse.response?.text;
        console.error("Autonomous reasoning failed to produce structured output. Raw response:", rawText);
        if (rawText) {
            try {
                const parsedOutput = JSON.parse(rawText);
                if (AutonomousReasoningOutputSchema.safeParse(parsedOutput).success) {
                     console.warn("Autonomous reasoning successfully parsed raw text fallback.");
                    return { ...parsedOutput, relevantKnowledgeIds: relevantOriginalItemIds } as AutonomousReasoningOutput;
                }
            } catch (e) {
                 // Ignore
            }
        }
        throw new Error(`Autonomous reasoning failed. Model response: ${rawText ? rawText.substring(0,200) : 'No raw text'}`);
    }
    return { ...modelResponse.output, relevantKnowledgeIds: relevantOriginalItemIds };
  }
);
