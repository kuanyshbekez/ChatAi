
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import type { StoryEntry } from '@/components/game/HeroStoryGame';
import HomePageLayout from '@/components/layout/HomePageLayout';
import HeroStoryGame from '@/components/game/HeroStoryGame';
import { generateAction, type GenerateActionInput, type GenerateActionOutput } from '@/ai/flows/generate-action';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { GameSaveSlot, GameMetadata } from '@/types/game';
import { saveGameSlot } from '@/services/gameDataService';


interface NewGameFormDetails {
  initialPrompt: string;
  storyTitle?: string;
  keywords?: string;
  playerName?: string;
  playerRace?: string;
  playerSocialStatus?: string;
  eventTimeDetails?: string;
  universeName?: string;
  customAdditions?: string;
}

export default function Home() {
  const [activeGameParams, setActiveGameParams] = useState<{
    storyLogToLoad?: StoryEntry[];
    gameMetadataToLoad?: GameMetadata;
    saveSlotKeyToLoad?: string;
    initialSaveSlotKey?: string; 
  } | null>(null);

  const [isStartingGame, setIsStartingGame] = useState(false);
  const { toast } = useToast();

  const handleStartNewGame = useCallback(async (details: NewGameFormDetails) => {
    setIsStartingGame(true);
    if (details.initialPrompt.trim() === '') {
      toast({
        title: "Нужен ваш мир",
        description: "Пожалуйста, опишите вселенную, в которой начнется ваша история.",
        variant: "default",
      });
      setIsStartingGame(false);
      return;
    }

    let playerInputForAI = `Основное описание мира: ${details.initialPrompt}\n`;
    if (details.playerName) playerInputForAI += `\nИмя Игрока: ${details.playerName}`;
    if (details.playerRace) playerInputForAI += `\nРаса Игрока: ${details.playerRace}`;
    if (details.playerSocialStatus) playerInputForAI += `\nСоциальный Статус Игрока: ${details.playerSocialStatus}`;
    if (details.eventTimeDetails) playerInputForAI += `\nВремя и Место Событий: ${details.eventTimeDetails}`;
    if (details.universeName) playerInputForAI += `\nВселенная: ${details.universeName}`;
    if (details.customAdditions) playerInputForAI += `\nОсобые Замечания/Добавления от Игрока: ${details.customAdditions}`;
    
    try {
      const startInput: GenerateActionInput = {
        actionType: 'История',
        currentStory: 'Начало новой игры. Мир был только что создан по детальному описанию игрока.',
        playerInput: playerInputForAI,
        playerName: details.playerName,
        playerRace: details.playerRace,
        playerSocialStatus: details.playerSocialStatus,
        eventTimeDetails: details.eventTimeDetails,
        universeName: details.universeName,
        customAdditions: details.customAdditions,
        isStoryStartContext: true, // Explicitly set for new game/story start
      };

      const result: GenerateActionOutput = await generateAction(startInput);
      const newStoryLogEntry: StoryEntry = { 
        id: crypto.randomUUID(), 
        type: 'ai', 
        text: result.nextAction,
        action: 'История'
      };
      
      const newSaveKey = `save_${Date.now()}`;
      
      const aiGeneratedKeywords = result.generatedKeywords;
      const userProvidedKeywords = details.keywords;
      let finalKeywords = '';
      if (aiGeneratedKeywords && aiGeneratedKeywords.trim() !== '') {
        finalKeywords = aiGeneratedKeywords;
      } else if (userProvidedKeywords && userProvidedKeywords.trim() !== '') {
        finalKeywords = userProvidedKeywords;
      }

      const newGameMetadata: GameMetadata = {
        storyTitle: details.storyTitle || `Новая история от ${new Date().toLocaleDateString('ru-RU')}`,
        storyDescription: details.initialPrompt.substring(0, 150) + (details.initialPrompt.length > 150 ? "..." : ""),
        isPublished: false,
        keywords: finalKeywords,
        playerName: details.playerName,
        playerRace: details.playerRace,
        playerSocialStatus: details.playerSocialStatus,
        eventTimeDetails: details.eventTimeDetails,
        universeName: details.universeName,
        customAdditions: details.customAdditions,
        characterName: details.playerName, 
      };

      const newSaveSlot: GameSaveSlot = {
        log: [newStoryLogEntry],
        metadata: newGameMetadata,
        lastModified: Date.now(),
      };
      
      try {
        await saveGameSlot(newSaveKey, newSaveSlot);
      } catch (error) {
        console.error("Failed to pre-save game via service:", error);
      }

      setActiveGameParams({ 
        storyLogToLoad: [newStoryLogEntry], 
        gameMetadataToLoad: newGameMetadata,
        initialSaveSlotKey: newSaveKey 
      });
    } catch (error) {
      console.error("Error generating initial story:", error);
      toast({
        title: "Ошибка ИИ",
        description: "Не удалось сгенерировать начало истории. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsStartingGame(false);
    }
  }, [toast]);

  const handleLoadGame = useCallback((slotKey: string) => {
    setActiveGameParams({ saveSlotKeyToLoad: slotKey });
  }, []);

  const handleExitGame = useCallback(() => {
    setActiveGameParams(null);
  }, []);

  if (isStartingGame && !activeGameParams) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-xl text-muted-foreground">Создаем ваш мир...</p>
      </div>
    );
  }

  if (activeGameParams) {
    return (
      <HeroStoryGame
        storyLogToLoad={activeGameParams.storyLogToLoad}
        gameMetadataToLoad={activeGameParams.gameMetadataToLoad}
        saveSlotKeyToLoad={activeGameParams.saveSlotKeyToLoad}
        initialSaveSlotKey={activeGameParams.initialSaveSlotKey}
        onExitGame={handleExitGame}
      />
    );
  }

  return (
    <HomePageLayout
      onStartNewGameRequested={handleStartNewGame}
      onLoadGameRequested={handleLoadGame}
    />
  );
}

