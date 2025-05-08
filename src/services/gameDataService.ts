// src/services/gameDataService.ts

import type { GameSaveSlot, GameMetadata } from '@/types/game';
// StoryEntry is implicitly used via GameSaveSlot from '@/types/game'

const SAVES_LIST_STORAGE_KEY = 'heroStoryGameSavesList';

// NOTE: This service uses localStorage and should only be called from client-side components.
// It is NOT a server action.

export async function saveGameSlot(slotKey: string, gameData: GameSaveSlot): Promise<void> {
  // console.log(`Client-side: Saving game slot ${slotKey} to localStorage.`);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const allSavesRaw = localStorage.getItem(SAVES_LIST_STORAGE_KEY);
      let allSaves: Record<string, GameSaveSlot> = {};
      if (allSavesRaw) {
        try {
          const parsed = JSON.parse(allSavesRaw);
          if (typeof parsed === 'object' && parsed !== null) {
            allSaves = parsed;
          }
        } catch (e) {
          console.error("Error parsing existing saves from localStorage in saveGameSlot:", e);
        }
      }
      allSaves[slotKey] = gameData;
      localStorage.setItem(SAVES_LIST_STORAGE_KEY, JSON.stringify(allSaves));
    } else {
      console.warn("localStorage is not available. Game not saved.");
    }
  } catch (error) {
    console.error(`Failed to save game slot ${slotKey} to localStorage:`, error);
    // Re-throwing the error so the caller can handle it, e.g., by showing a toast.
    throw new Error(`Failed to save game slot ${slotKey}`);
  }
}

export async function loadGameSlot(slotKey: string): Promise<GameSaveSlot | null> {
  // console.log(`Client-side: Loading game slot ${slotKey} from localStorage.`);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const allSavesRaw = localStorage.getItem(SAVES_LIST_STORAGE_KEY);
      if (!allSavesRaw) {
        return null;
      }
      const allSaves: Record<string, GameSaveSlot> = JSON.parse(allSavesRaw);
      return allSaves[slotKey] || null;
    }
    console.warn("localStorage is not available. Cannot load game.");
    return null;
  } catch (error) {
    console.error(`Failed to load game slot ${slotKey} from localStorage:`, error);
    return null;
  }
}

export async function loadAllGameSlots(): Promise<Record<string, GameSaveSlot>> {
  // console.log(`Client-side: Loading all game slots from localStorage.`);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const allSavesRaw = localStorage.getItem(SAVES_LIST_STORAGE_KEY);
      if (!allSavesRaw) {
        return {};
      }
      return JSON.parse(allSavesRaw) || {};
    }
    console.warn("localStorage is not available. Cannot load all games.");
    return {};
  } catch (error) {
    console.error("Failed to load all game slots from localStorage:", error);
    return {};
  }
}

export async function updateGameMetadata(slotKey: string, metadataUpdates: Partial<GameMetadata>): Promise<void> {
  // console.log(`Client-side: Updating metadata for game slot ${slotKey} in localStorage.`);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const gameSlot = await loadGameSlot(slotKey); // loadGameSlot already handles localStorage check
      if (gameSlot) {
        const updatedSlot: GameSaveSlot = {
          ...gameSlot,
          metadata: {
            // Ensure metadata object exists, providing a default if it doesn't.
            // The default should ideally match structure of GameMetadata.
            storyTitle: gameSlot.metadata?.storyTitle || "Безымянная история",
            storyDescription: gameSlot.metadata?.storyDescription || "Нет описания.",
            isPublished: gameSlot.metadata?.isPublished || false,
            keywords: gameSlot.metadata?.keywords || '',
            characterName: gameSlot.metadata?.characterName || '',
            characterAppearance: gameSlot.metadata?.characterAppearance || '',
            characterPowers: gameSlot.metadata?.characterPowers || '',
            playerName: gameSlot.metadata?.playerName || '',
            playerRace: gameSlot.metadata?.playerRace || '',
            playerSocialStatus: gameSlot.metadata?.playerSocialStatus || '',
            eventTimeDetails: gameSlot.metadata?.eventTimeDetails || '',
            universeName: gameSlot.metadata?.universeName || '',
            customAdditions: gameSlot.metadata?.customAdditions || '',
            // Apply updates
            ...metadataUpdates,
          },
          lastModified: Date.now(), // Update lastModified timestamp
        };
        // saveGameSlot will handle localStorage check and saving
        await saveGameSlot(slotKey, updatedSlot);
      } else {
        throw new Error(`Game slot ${slotKey} not found for metadata update.`);
      }
    } else {
      console.warn("localStorage is not available. Metadata not updated.");
    }
  } catch (error) {
    console.error(`Failed to update metadata for game slot ${slotKey}:`, error);
    throw error; // Re-throw to be handled by caller
  }
}
