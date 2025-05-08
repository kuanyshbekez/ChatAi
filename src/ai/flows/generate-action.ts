
'use server';

/**
 * @fileOverview Flow for generating the next action or event in the story using Gemini.
 *
 * - generateAction - A function that generates the next action or event in the story.
 * - GenerateActionInput - The input type for the generateAction function.
 * - GenerateActionOutput - The return type for the generateAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActionInputSchema = z.object({
  actionType: z
    .enum(['Сказать', 'Делать', 'История'])
    .describe('The type of action the player wants to perform.'),
  currentStory: z.string().describe('The current state of the story.'),
  playerInput: z.string().optional().describe('The player input for the action, or initial world description if actionType is "История".'),
  // Add new context fields from GameMetadata
  playerName: z.string().optional().describe('The name of the player character.'),
  playerRace: z.string().optional().describe('The race or species of the player character.'),
  playerSocialStatus: z.string().optional().describe('The social status or role of the player character.'),
  eventTimeDetails: z.string().optional().describe('Details about the time period and setting (e.g., "Medieval era, year 1250").'),
  universeName: z.string().optional().describe('The name of the game universe (e.g., "Marvel", "My Custom Universe: Eldoria").'),
  customAdditions: z.string().optional().describe('Specific custom rules or elements defined by the player for this universe.'),
  isStoryStartContext: z.boolean().optional().describe('Indicates if the current action is setting up the initial story context (actionType === "История"). Used for conditional prompting.')
});
export type GenerateActionInput = z.infer<typeof GenerateActionInputSchema>;

const GenerateActionOutputSchema = z.object({
  nextAction: z.string().describe('The next action or event in the story.'),
  generatedKeywords: z.string().optional().describe('Comma-separated keywords relevant to the story, generated if actionType is "История".')
});
export type GenerateActionOutput = z.infer<typeof GenerateActionOutputSchema>;

export async function generateAction(input: GenerateActionInput): Promise<GenerateActionOutput> {
  return generateActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionPrompt',
  input: {schema: GenerateActionInputSchema},
  output: {schema: GenerateActionOutputSchema},
  prompt: `Ты играешь в текстовую игру в стиле AI Dungeon. Gemini будет генерировать действия.

  Текущая история: {{{currentStory}}}

  {{#if universeName}}
  Вселенная: {{{universeName}}}
  {{/if}}
  {{#if eventTimeDetails}}
  Время и место: {{{eventTimeDetails}}}
  {{/if}}
  
  {{#if playerName}}
  Игрок: {{{playerName}}}
    {{#if playerRace}}
    (Раса: {{{playerRace}}})
    {{/if}}
    {{#if playerSocialStatus}}
    (Положение: {{{playerSocialStatus}}})
    {{/if}}
  {{/if}}

  {{#if customAdditions}}
  Особые правила/элементы мира: {{{customAdditions}}}
  {{/if}}

  Тип действия: {{{actionType}}}

  {{#if playerInput}}
    {{#if isStoryStartContext}}
  Описание мира/завязка от игрока: {{{playerInput}}}
    {{else}}
  Ввод игрока: {{{playerInput}}}
    {{/if}}
  {{/if}}

  Сгенерируй следующее действие или событие в истории на русском языке. Сделай его подробным и захватывающим, учитывая всю предоставленную контекстную информацию.
  {{#if isStoryStartContext}}
  Если это начало истории (isStoryStartContext истинно), создай интригующее вступление.
  Дополнительно, проанализируй ввод игрока ({{{playerInput}}}) и/или сгенерированное событие и предложи 3-5 ключевых слов, описывающих жанр, сеттинг или основные темы истории, в виде строки через запятую. Например: фэнтези, средневековье, драконы, квест. Помести их в поле generatedKeywords. Если ввод игрока слишком короткий или общий для генерации осмысленных ключевых слов, поле generatedKeywords можно оставить пустым.
  {{/if}}`,
});

const generateActionFlow = ai.defineFlow(
  {
    name: 'generateActionFlow',
    inputSchema: GenerateActionInputSchema,
    outputSchema: GenerateActionOutputSchema,
  },
  async (rawInput) => {
    const inputForPrompt = {
      ...rawInput,
      isStoryStartContext: rawInput.actionType === 'История',
    };
    const {output} = await prompt(inputForPrompt);
    return output!;
  }
);

