// src/ai/flows/integrate-player-choice.ts
'use server';
/**
 * @fileOverview Implements the Genkit flow to integrate player choices into the story narrative.
 *
 * - integratePlayerChoice - A function that integrates the player's choice into the story and generates the next part of the narrative.
 * - IntegratePlayerChoiceInput - The input type for the integratePlayerChoice function.
 * - IntegratePlayerChoiceOutput - The return type for the integratePlayerChoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntegratePlayerChoiceInputSchema = z.object({
  storySoFar: z.string().describe('The current story text.'),
  playerChoice: z.enum(['Сказать', 'Делать', 'История']).describe('The player\'s action choice.'),
  playerInput: z.string().optional().describe('Optional player input for the action.'),
});
export type IntegratePlayerChoiceInput = z.infer<typeof IntegratePlayerChoiceInputSchema>;

const IntegratePlayerChoiceOutputSchema = z.object({
  newStoryText: z.string().describe('The updated story text with the player choice integrated.'),
});
export type IntegratePlayerChoiceOutput = z.infer<typeof IntegratePlayerChoiceOutputSchema>;

export async function integratePlayerChoice(input: IntegratePlayerChoiceInput): Promise<IntegratePlayerChoiceOutput> {
  return integratePlayerChoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'integratePlayerChoicePrompt',
  input: {schema: IntegratePlayerChoiceInputSchema},
  output: {schema: IntegratePlayerChoiceOutputSchema},
  prompt: `Ты играешь как в ai dungeon. You are playing a text-based adventure game. The current story is:\n\n{{{storySoFar}}}\n\nThe player has chosen to perform the following action: {{{playerChoice}}} {{{playerInput}}}.\n\nContinue the story, incorporating the player's choice in a meaningful and interesting way. Write in Russian. Make the story segment engaging and descriptive.\n`, 
});

const integratePlayerChoiceFlow = ai.defineFlow(
  {
    name: 'integratePlayerChoiceFlow',
    inputSchema: IntegratePlayerChoiceInputSchema,
    outputSchema: IntegratePlayerChoiceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
