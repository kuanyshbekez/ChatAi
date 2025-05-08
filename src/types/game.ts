// src/types/game.ts
// import type { StoryEntry } from '@/components/game/HeroStoryGame'; // Removed: StoryEntry will be defined here

export type PlayerActionType = 'Действовать' | 'ПисатьИсторию' | 'ПродолжитьСюжет';

export type StoryEntry = {
  id: string;
  type: 'ai' | 'player';
  text: string;
  action?: PlayerActionType | 'История'; // 'История' is typically for AI or unmigrated/default
};

export interface GameMetadata {
  storyTitle: string;
  storyDescription: string;
  characterName?: string; // Keep for backward compatibility or general character ref
  characterAppearance?: string;
  characterPowers?: string;
  isPublished?: boolean; // For public sharing
  keywords?: string; // Comma-separated for story categorization/search
  
  // New fields for richer story context
  playerName?: string;
  playerRace?: string;
  playerSocialStatus?: string; // e.g., king, peasant, rebel leader
  eventTimeDetails?: string; // e.g., "Medieval era, year 1250, during a harsh winter"
  universeName?: string; // e.g., "Marvel", "My Custom Universe: Eldoria", "Post-apocalyptic Earth"
  customAdditions?: string; // User's specific notes/additions for the AI to consider
}

export interface GameSaveSlot {
  log: StoryEntry[];
  metadata: GameMetadata;
  lastModified: number;
}
