
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, FileText, Play, Send, XCircle, Loader2, LogOut, Edit3 } from 'lucide-react';
import { integratePlayerChoice, type IntegratePlayerChoiceInput, type IntegratePlayerChoiceOutput } from '@/ai/flows/integrate-player-choice';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { GameSaveSlot, GameMetadata, StoryEntry, PlayerActionType } from '@/types/game'; // Import types from central location
import EditStoryDetailsModal from './EditStoryDetailsModal';
import { saveGameSlot, loadGameSlot } from '@/services/gameDataService';
import { migrateStoryLogIfNeeded } from '@/lib/gameUtils'; // Updated import path

// PlayerActionType and StoryEntry are now imported from '@/types/game'

const AUTOSAVE_INTERVAL = 5000; 

interface HeroStoryGameProps {
  storyLogToLoad?: StoryEntry[];
  gameMetadataToLoad?: GameMetadata;
  saveSlotKeyToLoad?: string;
  initialSaveSlotKey?: string; 
  onExitGame: () => void;
}

const defaultGameMetadata: GameMetadata = {
  storyTitle: "Безымянная история",
  storyDescription: "Описание еще не добавлено.",
  isPublished: false,
  keywords: '',
  characterName: '',
  characterAppearance: '',
  characterPowers: '',
  playerName: '',
  playerRace: '',
  playerSocialStatus: '',
  eventTimeDetails: '',
  universeName: '',
  customAdditions: '',
};

export default function HeroStoryGame({ 
  storyLogToLoad: storyEntriesToLoadFromProp, 
  gameMetadataToLoad: initialGameMetadata,
  saveSlotKeyToLoad,
  initialSaveSlotKey,
  onExitGame 
}: HeroStoryGameProps) {
  const [storyLog, setStoryLog] = useState<StoryEntry[]>([]);
  const [gameMetadata, setGameMetadata] = useState<GameMetadata>({...defaultGameMetadata, ...(initialGameMetadata || {})});
  const [isLoading, setIsLoading] = useState(false); 
  const [showInputFor, setShowInputFor] = useState<Extract<PlayerActionType, 'Действовать' | 'ПисатьИсторию'> | null>(null);
  const [playerInputText, setPlayerInputText] = useState('');
  
  const [currentSaveSlotKey, setCurrentSaveSlotKey] = useState<string | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);


  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [storyLog, scrollToBottom]);

  const persistGameState = useCallback(async (slotKey: string, logToSave: StoryEntry[], currentMetadata: GameMetadata) => {
    if (!logToSave || logToSave.length === 0) return; 
    
    const gameSlotData: GameSaveSlot = {
      log: logToSave,
      metadata: { 
        ...defaultGameMetadata,
        ...currentMetadata, 
      },
      lastModified: Date.now(),
    };

    try {
      await saveGameSlot(slotKey, gameSlotData);
      // console.log(`Game state saved for slot ${slotKey}`); // Optional: for debugging
    } catch (error) {
      console.error("Failed to save game to via service:", error);
      toast({ title: "Ошибка сохранения", description: "Не удалось сохранить игру автоматически.", variant: "destructive" });
    }
  }, [toast]);
  
  const loadSpecificGameFromService = useCallback(async (slotKeyToLoad: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const slotToLoad = await loadGameSlot(slotKeyToLoad);

      if (!slotToLoad || !slotToLoad.log) {
        throw new Error(`Слот сохранения ${slotKeyToLoad} не найден или поврежден.`);
      }
      
      const migratedLog = migrateStoryLogIfNeeded(slotToLoad.log);
        
      setStoryLog(migratedLog);
      const loadedMetadata = {
        ...defaultGameMetadata, 
        ...(slotToLoad.metadata || { 
            storyTitle: `История от ${new Date(slotToLoad.lastModified || Date.now()).toLocaleDateString('ru-RU')}`, 
            storyDescription: "Нет описания.",
            isPublished: false,
            keywords: '',
        }),
      };
      setGameMetadata(loadedMetadata);
      setCurrentSaveSlotKey(slotKeyToLoad);
      toast({ title: "Игра загружена", description: `Прогресс для "${loadedMetadata.storyTitle}" восстановлен.` });
      return true;
    } catch (error) {
      console.error("Error loading specific game from service:", error);
      toast({ title: "Ошибка загрузки", description: `Не удалось загрузить игру: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}.`, variant: "destructive"});
      onExitGame(); 
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, onExitGame]);


  useEffect(() => {
    async function initializeGame() {
      if (saveSlotKeyToLoad) {
        await loadSpecificGameFromService(saveSlotKeyToLoad);
      } else if (storyEntriesToLoadFromProp && initialSaveSlotKey) {
        // For new games, log might need migration if it's somehow in an old format (unlikely for new)
        const migratedPropLog = migrateStoryLogIfNeeded(storyEntriesToLoadFromProp);
        setStoryLog(migratedPropLog);
        const currentMeta = {
          ...defaultGameMetadata,
          ...(initialGameMetadata || {}),
        };
        setGameMetadata(currentMeta);
        setCurrentSaveSlotKey(initialSaveSlotKey);
        // Persist the initial state passed by props
        await persistGameState(initialSaveSlotKey, migratedPropLog, currentMeta);
      } else {
        console.warn("HeroStoryGame loaded without initial data or save key. Exiting to home.");
        onExitGame(); 
      }
    }
    initializeGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveSlotKeyToLoad, initialSaveSlotKey]); 


  const silentSaveGame = useCallback(async () => {
    if (storyLog.length === 0 || !currentSaveSlotKey) return;
    await persistGameState(currentSaveSlotKey, storyLog, gameMetadata);
  }, [storyLog, currentSaveSlotKey, gameMetadata, persistGameState]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      silentSaveGame();
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [silentSaveGame]);
  
  const handleActionSelect = (actionType: PlayerActionType) => {
    if (actionType === 'ПродолжитьСюжет') {
      processPlayerChoice(actionType);
    } else { 
      setShowInputFor(actionType as Extract<PlayerActionType, 'Действовать' | 'ПисатьИсторию'>);
      setPlayerInputText(''); 
    }
  };

  const handlePlayerInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPlayerInputText(event.target.value);
  };

  const handleSubmitInput = () => {
    if (!showInputFor || playerInputText.trim() === '') {
      toast({
        title: "Нужен ввод",
        description: `Пожалуйста, введите текст для вашего действия "${showInputFor}".`,
        variant: "default",
      });
      return;
    }
    processPlayerChoice(showInputFor, playerInputText);
    setShowInputFor(null);
    setPlayerInputText('');
  };

  const handleCancelInput = () => {
    setShowInputFor(null);
    setPlayerInputText('');
  };

  const processPlayerChoice = async (actionType: PlayerActionType, playerText?: string) => {
    setIsLoading(true);

    let playerActionDisplay = '';
    let playerEntryAction: PlayerActionType = actionType;

    switch (actionType) {
      case 'Действовать':
        playerActionDisplay = `Игрок действует: "${playerText}"`;
        break;
      case 'ПисатьИсторию':
        // For 'ПисатьИсторию', the display text is the player's raw input.
        // The AI is not called for this action type directly.
        playerActionDisplay = playerText || ""; 
        break;
      case 'ПродолжитьСюжет':
        playerActionDisplay = `Игрок продвигает историю дальше.`;
        break;
    }

    const playerEntry: StoryEntry = {
      id: crypto.randomUUID(),
      type: 'player',
      text: playerActionDisplay,
      action: playerEntryAction,
    };
    
    if (actionType === 'ПисатьИсторию') {
      // Directly add the player's story segment to the log.
      setStoryLog(prevLog => [...prevLog, playerEntry]);
      setIsLoading(false);
      await silentSaveGame(); // Trigger a save after direct story addition
      return; 
    }

    // Add player entry to log for AI context and display
    const updatedStoryLogForAI = [...storyLog, playerEntry];
    setStoryLog(updatedStoryLogForAI); 
    
    const historyForAI = updatedStoryLogForAI 
      .map(entry => entry.text) 
      .join('\n\n'); 
    
    let genkitActionType: IntegratePlayerChoiceInput['playerChoice'] = 'История'; // Default for 'ПродолжитьСюжет'
    if (actionType === 'Действовать') genkitActionType = 'Делать';
    // 'ПисатьИсторию' does not call integratePlayerChoice flow.

    const inputData: IntegratePlayerChoiceInput = {
      storySoFar: historyForAI,
      playerChoice: genkitActionType, 
      playerInput: actionType === 'Действовать' ? playerText : undefined, 
    };

    try {
      const result: IntegratePlayerChoiceOutput = await integratePlayerChoice(inputData);
      setStoryLog(prevLog => [...prevLog, { id: crypto.randomUUID(), type: 'ai', text: result.newStoryText, action: 'История' }]);
    } catch (error) {
      console.error("Error integrating player choice:", error);
      const errorText = `Произошла ошибка при обработке действия "${actionType}". Попробуйте еще раз.`;
      setStoryLog(prevLog => [...prevLog, { id: crypto.randomUUID(), type: 'ai', text: errorText, action: 'История' }]);
      toast({
        title: "Ошибка Истории",
        description: "Не удалось обработать ваш выбор. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getInputPlaceholder = () => {
    if (showInputFor === 'Действовать') return 'Что ты хочешь сделать или сказать?';
    if (showInputFor === 'ПисатьИсторию') return 'Напиши свою часть истории...';
    return '';
  };

  const handleSaveMetadata = async (updatedMetadata: GameMetadata) => {
    const newMetadata = { ...defaultGameMetadata, ...gameMetadata, ...updatedMetadata };
    setGameMetadata(newMetadata);
    if (currentSaveSlotKey) {
      await persistGameState(currentSaveSlotKey, storyLog, newMetadata);
      toast({ title: "Детали сохранены", description: "Информация о вашей истории обновлена."});
    }
    setShowEditModal(false);
  };

  if (!currentSaveSlotKey && storyLog.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-muted-foreground">Ошибка загрузки игры.</p>
        <p className="text-sm text-muted-foreground mb-4">Не удалось загрузить данные или ключ сохранения.</p>
        <Button onClick={onExitGame} variant="outline">Вернуться на главную</Button>
      </div>
    );
  }
  

  return (
    <div className="flex flex-col h-screen p-4 md:p-6 lg:p-8 bg-background text-foreground font-sans">
      <header className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-col items-start">
           <h1 className="text-2xl md:text-3xl font-bold text-primary">{gameMetadata.storyTitle}</h1>
           {gameMetadata.storyDescription && <p className="text-sm text-muted-foreground mt-1 max-w-xl truncate" title={gameMetadata.storyDescription}>{gameMetadata.storyDescription}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEditModal(true)} disabled={isLoading || showInputFor !== null} variant="outline" className="shadow-sm">
            <Edit3 className="mr-2 h-4 w-4" /> Редактировать
          </Button>
          <Button onClick={onExitGame} disabled={isLoading || showInputFor !== null} variant="outline" className="shadow-sm">
            <LogOut className="mr-2 h-4 w-4" /> Выйти из игры
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-grow mb-4 md:mb-6 rounded-lg shadow-md" ref={scrollAreaRef}>
        <Card className="h-full border-none bg-card">
          <CardContent className="p-4 md:p-6 space-y-3 leading-relaxed">
            {storyLog.map((entry) => (
              <p key={entry.id} className={cn(
                'text-base md:text-lg whitespace-pre-wrap text-card-foreground', 
                entry.type === 'player' && entry.action === 'Действовать' && 'text-accent font-medium italic',
                entry.type === 'player' && entry.action === 'ПисатьИсторию' && 'text-primary-foreground bg-primary/20 p-2 rounded-md',
                entry.type === 'player' && entry.action === 'ПродолжитьСюжет' && 'text-secondary font-medium italic'
              )}>
                {entry.text}
              </p>
            ))}
            {isLoading && 
              storyLog.length > 0 && 
              storyLog[storyLog.length -1].type === 'player' && 
              (storyLog[storyLog.length-1].action !== 'ПисатьИсторию') && 
              <div className="flex items-center text-muted-foreground animate-pulse pt-2 text-base md:text-lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>История обрабатывает ваш выбор...</span>
              </div>
            }
          </CardContent>
        </Card>
      </ScrollArea>

      <div className="space-y-3 md:space-y-4">
        {showInputFor && (
          <Card className="p-3 md:p-4 shadow-md bg-card">
            <div className="flex flex-col sm:flex-row gap-2">
              {showInputFor === 'ПисатьИсторию' ? (
                <Textarea
                  value={playerInputText}
                  onChange={handlePlayerInputChange}
                  placeholder={getInputPlaceholder()}
                  disabled={isLoading}
                  className="flex-grow text-sm md:text-base shadow-sm min-h-[100px]"
                  onKeyPress={(e) => e.key === 'Enter' && e.shiftKey === false && !isLoading && handleSubmitInput()}
                  aria-label="Ввод для написания истории"
                />
              ) : (
                <Input
                  type="text"
                  value={playerInputText}
                  onChange={handlePlayerInputChange}
                  placeholder={getInputPlaceholder()}
                  disabled={isLoading}
                  className="flex-grow text-sm md:text-base shadow-sm"
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSubmitInput()}
                  aria-label="Ввод для действия"
                />
              )}
              <div className="flex gap-2 mt-2 sm:mt-0 sm:flex-col justify-end">
                <Button onClick={handleSubmitInput} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-sm">
                  <Send className="mr-2 h-4 w-4" /> Отправить
                </Button>
                <Button onClick={handleCancelInput} variant="outline" disabled={isLoading} className="w-full sm:w-auto shadow-sm">
                  <XCircle className="mr-2 h-4 w-4" /> Отмена
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <Button 
            onClick={() => handleActionSelect('Действовать')} 
            disabled={isLoading || !!showInputFor} 
            variant="secondary"
            className="py-3 text-base shadow-sm"
            aria-label="Совершить действие или сказать что-либо"
          >
            <Zap className="mr-2 h-5 w-5" /> Действовать
          </Button>
          <Button 
            onClick={() => handleActionSelect('ПисатьИсторию')} 
            disabled={isLoading || !!showInputFor} 
            variant="secondary"
            className="py-3 text-base shadow-sm" 
            aria-label="Написать свою часть истории"
          >
            <FileText className="mr-2 h-5 w-5" /> Писать историю
          </Button>
          <Button 
            onClick={() => handleActionSelect('ПродолжитьСюжет')} 
            disabled={isLoading || !!showInputFor} 
            className="py-3 text-base bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
            aria-label="Продолжить сюжет с помощью Истории"
          >
            <Play className="mr-2 h-5 w-5" /> Продолжить
          </Button>
        </div>
      </div>
      
       {showEditModal && currentSaveSlotKey && (
        <EditStoryDetailsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          gameMetadata={gameMetadata} 
          onSave={handleSaveMetadata}
        />
      )}

    </div>
  );
}
