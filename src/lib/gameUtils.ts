// src/lib/gameUtils.ts
// This file does not use 'use server' as it's for client-side utilities.
import type { StoryEntry } from '@/types/game'; // Import from the central types file

/**
 * Migrates a story log to the latest StoryEntry format,
 * handling old formats (like array of strings) and ensuring actions are correctly mapped.
 * @param log - The story log to migrate. Can be of various old formats or already new.
 * @returns A new array of StoryEntry objects in the latest format.
 */
export function migrateStoryLogIfNeeded(log: any): StoryEntry[] {
    if (!Array.isArray(log)) {
        return []; // Not an array, cannot migrate
    }
    if (log.length === 0) {
        return []; // Empty array, nothing to migrate
    }

    // Check if it's an old array of strings (earliest format)
    if (typeof log[0] === 'string') {
        return (log as string[]).map((text: string) => ({
            id: crypto.randomUUID(),
            type: 'ai', // Old logs were mostly AI turns or simple text
            text: text,
            action: 'История' // Default action for migrated AI/text entries
        }));
    }

    // Check if it's an array of objects (potentially new or partially migrated format)
    if (typeof log[0] === 'object' && log[0] !== null) {
        return log.map((entry: any) => {
            const newEntry = { ...entry }; // Make a copy to avoid mutating the original

            // Ensure basic fields exist if migrating from a very minimal object structure
            if (!newEntry.id) newEntry.id = crypto.randomUUID();
            if (typeof newEntry.type !== 'string' || !['ai', 'player'].includes(newEntry.type)) {
                 newEntry.type = 'ai'; // Default type if missing or invalid
            }
            if (typeof newEntry.text !== 'string') newEntry.text = '';   // Default text if missing

            // Migrate actions
            if (newEntry.type === 'player') {
                if (newEntry.action === 'История') {
                    // Specific text indicating "ПродолжитьСюжет" (player chose to continue story without specific input)
                    if (newEntry.text && (
                        newEntry.text.includes("Игрок продвигает историю дальше.") ||
                        newEntry.text.includes("Игрок продвигает сюжет.")
                    )) {
                        newEntry.action = 'ПродолжитьСюжет';
                    } else {
                        // Otherwise, player 'История' entries are direct contributions to the narrative
                        newEntry.action = 'ПисатьИсторию';
                    }
                } else if (newEntry.action === 'Сказать' || newEntry.action === 'Делать') {
                    newEntry.action = 'Действовать';
                }
                // If action is already 'Действовать', 'ПисатьИсторию', 'ПродолжитьСюжет', it's considered up-to-date.
            } else if (newEntry.type === 'ai') {
                // For AI entries, 'История' is the standard/expected action.
                // If action is missing or something else (e.g. from very old format), default it.
                 newEntry.action = 'История';
            }
            
            // Fallback: If action is still undefined for some reason (e.g., unexpected old data structure)
            if (typeof newEntry.action !== 'string') {
                 newEntry.action = 'История'; // Generic fallback action
            }

            return newEntry as StoryEntry;
        });
    }

    return []; // Unrecognized format, return empty array
}
