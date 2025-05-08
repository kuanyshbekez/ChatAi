
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Rocket, FolderOpen, UserCircle, Loader2, BookOpen, Search, Palette, Gamepad2, Compass, Flame, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { GameSaveSlot, GameMetadata } from '@/types/game';
import ProfilePage from '@/components/profile/ProfilePage';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { loadAllGameSlots } from '@/services/gameDataService';
import { loadUserProfile } from '@/services/userProfileService'; // For author name

type NewGameFormDetails = {
  initialPrompt: string;
  storyTitle?: string;
  keywords?: string;
  playerName?: string;
  playerRace?: string;
  playerSocialStatus?: string;
  eventTimeDetails?: string;
  universeName?: string;
  customAdditions?: string;
};

interface HomePageLayoutProps {
  onStartNewGameRequested: (details: NewGameFormDetails) => Promise<void>;
  onLoadGameRequested: (slotKey: string) => void;
}

type AvailableSaveViewModel = {
  key: string;
  name: string; 
  lastModified: number;
  preview: string; 
  metadata: GameMetadata;
};

type StoryPlaceholder = {
  id: string; // slotKey
  title: string;
  author: string;
  description: string;
  image: string;
  dataAiHint: string;
  keywords?: string;
};

const placeholderTopStories: StoryPlaceholder[] = [
  { id: 't1', title: 'Киберпанк Нуар: Город Теней', author: 'Неоновый Детектив', image: 'https://picsum.photos/seed/cyberpunk/400/250', dataAiHint: 'neon city', description: 'Расследуйте загадочное убийство в мегаполисе будущего, где технологии опасны, а каждый скрывает свои секреты. Доверять нельзя никому.', keywords: 'киберпанк, нуар, детектив, город будущего' },
  { id: 't2', title: 'Галактический Курьер', author: 'АстроБот', image: 'https://picsum.photos/seed/galaxy/400/250', dataAiHint: 'stars spaceship', description: 'Доставляйте посылки по всей галактике, встречая странных существ и избегая космических пиратов.', keywords: 'космос, приключения, сай-фай, торговля' },
  { id: 't3', title: 'Фэнтези Эпопея: Драконьи Сказания', author: 'Магистр Слов', description: 'Станьте героем эпического фэнтези, где древние драконы пробуждаются, а судьба королевств висит на волоске. Ваш выбор определит будущее.', image: 'https://picsum.photos/seed/fantasy/400/250', dataAiHint: 'dragon castle', keywords: 'фэнтези, драконы, магия, эпос' },
  { id: 't4', title: 'Подводный мир: Зов Глубин', author: 'Капитан Аква', description: 'Исследуйте таинственные глубины океана, откройте затерянные цивилизации и столкнитесь с морскими чудовищами.', image: 'https://picsum.photos/seed/underwater/400/250', dataAiHint: 'ocean underwater', keywords: 'океан, подводный мир, исследования, тайны' },
];


export default function HomePageLayout({ onStartNewGameRequested, onLoadGameRequested }: HomePageLayoutProps) {
  const [showMainActionDialog, setShowMainActionDialog] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showLoadGameDialog, setShowLoadGameDialog] = useState(false);
  
  const [customInitialPrompt, setCustomInitialPrompt] = useState('');
  const [newGameStoryTitle, setNewGameStoryTitle] = useState('');
  const [newGameKeywords, setNewGameKeywords] = useState(''); 
  const [newGamePlayerName, setNewGamePlayerName] = useState('');
  const [newGamePlayerRace, setNewGamePlayerRace] = useState('');
  const [newGamePlayerSocialStatus, setNewGamePlayerSocialStatus] = useState('');
  const [newGameEventTimeDetails, setNewGameEventTimeDetails] = useState('');
  const [newGameUniverseName, setNewGameUniverseName] = useState('');
  const [newGameCustomAdditions, setNewGameCustomAdditions] = useState('');

  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [availableSaves, setAvailableSaves] = useState<AvailableSaveViewModel[]>([]);
  const [publicStories, setPublicStories] = useState<StoryPlaceholder[]>([]); 
  const { toast } = useToast();

  const [selectedStoryForDetail, setSelectedStoryForDetail] = useState<StoryPlaceholder | null>(null);
  const [currentTab, setCurrentTab] = useState("start-game");

  const loadPublicStoriesFromService = useCallback(async () => {
    setIsLoadingSaves(true);
    try {
      const allSavesObject = await loadAllGameSlots();
      const userProfile = await loadUserProfile();
      const authorName = userProfile?.gameName || userProfile?.username || 'Анонимный Автор';

      const loadedPublicStories = Object.entries(allSavesObject)
        .filter(([_, slot]) => slot?.metadata?.isPublished === true)
        .map(([key, slot]) => {
          if (!slot || !slot.log || !Array.isArray(slot.log)) return null; 
          
          const metadata = slot.metadata || {};
          const title = metadata.storyTitle || `История от ${new Date(slot.lastModified).toLocaleDateString('ru-RU')}`;
          const description = metadata.storyDescription || 'Нет описания.';
          const keywords = metadata.keywords || '';
          
          const hintKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
          const dataAiHint = hintKeywords.length > 0 ? hintKeywords.slice(0, 2).join(' ') : title.split(' ').slice(0, 2).join(' ').toLowerCase() || 'story game';

          return {
            id: key,
            title,
            author: authorName, 
            description,
            image: `https://picsum.photos/seed/${encodeURIComponent(key)}/400/250`, 
            dataAiHint: dataAiHint,
            keywords: keywords,
          };
        })
        .filter(Boolean) as StoryPlaceholder[];
      
      loadedPublicStories.sort((a, b) => a.title.localeCompare(b.title)); 
      setPublicStories(loadedPublicStories);
    } catch (error) {
      console.error("Error loading public stories from service:", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить общедоступные истории.", variant: "destructive"});
      setPublicStories([]);
    } finally {
      setIsLoadingSaves(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentTab === 'browse-stories') {
      loadPublicStoriesFromService();
    }
  }, [currentTab, loadPublicStoriesFromService]);


  const handleOpenNewGameDialog = () => {
    setShowMainActionDialog(false);
    setShowNewGameDialog(true);
    setCustomInitialPrompt('');
    setNewGameStoryTitle('');
    setNewGameKeywords(''); 
    setNewGamePlayerName('');
    setNewGamePlayerRace('');
    setNewGamePlayerSocialStatus('');
    setNewGameEventTimeDetails('');
    setNewGameUniverseName('');
    setNewGameCustomAdditions('');
  };

  const handleOpenLoadGameDialog = useCallback(async () => {
    setShowMainActionDialog(false);
    setShowLoadGameDialog(true);
    setIsLoadingSaves(true);
    try {
      const allSavesObject = await loadAllGameSlots();
      
      const loadedSaves = Object.entries(allSavesObject)
        .map(([key, slot]) => {
          if (!slot || !slot.log || !Array.isArray(slot.log) || slot.log.length === 0) return null;
          
          const lastModified = slot.lastModified || parseInt(key.split('_').pop() || '0') || Date.now();

          return {
            key,
            name: slot.metadata?.storyTitle || `Сохранение от ${new Date(lastModified).toLocaleString('ru-RU')}`,
            lastModified: lastModified,
            preview: slot.log[0]?.text.substring(0, 100) + (slot.log[0]?.text.length > 100 ? '...' : '') || 'Пустая история...',
            metadata: slot.metadata || {},
          };
        })
        .filter(Boolean) as AvailableSaveViewModel[];
      
      loadedSaves.sort((a, b) => b.lastModified - a.lastModified);
      setAvailableSaves(loadedSaves);
    } catch (error) {
      console.error("Error loading saves for dialog from service:", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить список сохранений.", variant: "destructive"});
      setAvailableSaves([]);
    } finally {
      setIsLoadingSaves(false);
    }
  }, [toast]);

  const handleStartNewGameSubmit = async () => {
    if (customInitialPrompt.trim() === '') {
      toast({ title: "Нужен ваш мир", description: "Пожалуйста, опишите вселенную для начала игры.", variant: "default" });
      return;
    }
    setIsStartingGame(true);
    
    const gameDetails: NewGameFormDetails = {
      initialPrompt: customInitialPrompt,
      storyTitle: newGameStoryTitle.trim() || undefined,
      keywords: newGameKeywords.trim() || undefined,
      playerName: newGamePlayerName.trim() || undefined,
      playerRace: newGamePlayerRace.trim() || undefined,
      playerSocialStatus: newGamePlayerSocialStatus.trim() || undefined,
      eventTimeDetails: newGameEventTimeDetails.trim() || undefined,
      universeName: newGameUniverseName.trim() || undefined,
      customAdditions: newGameCustomAdditions.trim() || undefined,
    };

    await onStartNewGameRequested(gameDetails);
    setShowNewGameDialog(false);
    // isStartingGame will be reset by parent or page transition
  };

  const handleLoadGameSelect = (slotKey: string) => {
    onLoadGameRequested(slotKey);
    setShowLoadGameDialog(false);
  };

  const handleStoryCardClick = (story: StoryPlaceholder) => {
    setSelectedStoryForDetail(story);
  };

  const handleStartStoryFromDetail = async () => {
    if (!selectedStoryForDetail) return;
    setIsStartingGame(true);
    
    const gameDetails: NewGameFormDetails = {
      initialPrompt: `Начать новую игру по готовому сюжету "${selectedStoryForDetail.title}". Описание мира: ${selectedStoryForDetail.description}. Ключевые слова: ${selectedStoryForDetail.keywords || 'не указаны'}. Создай захватывающее вступление, представь персонажа (или дай возможность игроку его создать/назвать) и первые испытания в рамках этого сюжета.`,
      storyTitle: selectedStoryForDetail.title,
      keywords: selectedStoryForDetail.keywords,
      universeName: selectedStoryForDetail.title,
    };
    await onStartNewGameRequested(gameDetails);
    setSelectedStoryForDetail(null);
    // isStartingGame will be reset by parent or page transition
  };

  const renderStoryCard = (story: StoryPlaceholder, type: 'community' | 'popular' | 'published') => (
    <Card 
      key={`${type}-${story.id}`} 
      className="hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col overflow-hidden rounded-xl group"
      onClick={() => handleStoryCardClick(story)}
      aria-label={`Открыть детали истории: ${story.title}`}
    >
      <div className="relative w-full h-40 overflow-hidden">
        <Image 
          src={story.image} 
          alt={story.title} 
          data-ai-hint={story.dataAiHint} 
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          style={{objectFit:"cover"}}
          className="group-hover:scale-105 transition-transform duration-300" 
        />
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
        <CardDescription className="text-xs pt-1">Автор: {story.author}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm text-muted-foreground flex-grow">
        <p className="line-clamp-3">{story.description}</p>
      </CardContent>
    </Card>
  );


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 shadow-md bg-card sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Palette size={32} className="text-primary" />
            <h1 className="text-2xl font-bold text-primary">История Героя</h1>
          </div>
          <Input 
            type="search" 
            placeholder="Поиск историй..." 
            className="w-1/3 hidden md:block"
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4">
        <Tabs defaultValue="start-game" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg shadow-sm">
            <TabsTrigger value="start-game" className="py-3 text-sm sm:text-base gap-2" aria-label="My Games Tab">
              <Gamepad2 size={18} /> Мои Игры
            </TabsTrigger>
            <TabsTrigger value="browse-stories" className="py-3 text-sm sm:text-base gap-2" aria-label="Browse Stories Tab">
              <Compass size={18} /> Обзор
            </TabsTrigger>
            <TabsTrigger value="popular-stories" className="py-3 text-sm sm:text-base gap-2" aria-label="Popular Stories Tab">
              <Flame size={18} /> Популярное
            </TabsTrigger>
            <TabsTrigger value="profile" className="py-3 text-sm sm:text-base gap-2" aria-label="Profile Tab">
              <UserCircle size={18} /> Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start-game" className="mt-0">
            <div className="flex flex-col items-center justify-center py-8 md:py-16">
              <Card className="w-full max-w-lg shadow-xl rounded-xl p-6 text-center bg-card">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">Создайте Свою Сагу</CardTitle>
                  <CardDescription className="text-muted-foreground mt-2">
                    Нажмите кнопку ниже, чтобы начать новое эпическое приключение или продолжить свой путь.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-24 h-24 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                    onClick={() => setShowMainActionDialog(true)}
                    aria-label="Начать или загрузить игру"
                  >
                    <PlusCircle size={56} />
                  </Button>
                </CardContent>
                <CardFooter className="mt-4 flex-col items-center">
                  <p className="text-sm text-muted-foreground">Ваше воображение - единственный предел.</p>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="browse-stories" className="mt-0">
            <ScrollArea className="h-[calc(100vh-230px)] rounded-lg">
              {isLoadingSaves && (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
              )}
              {!isLoadingSaves && publicStories.length === 0 && (
                <div className="text-center text-muted-foreground py-10 space-y-2">
                  <BookOpen size={48} className="mx-auto text-gray-400"/>
                  <p>Опубликованных историй пока нет.</p>
                  <p className="text-sm">Будьте первым, кто поделится своим приключением!</p>
                </div>
              )}
              {!isLoadingSaves && publicStories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                  {publicStories.map(story => renderStoryCard(story, 'published'))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="popular-stories" className="mt-0">
             <ScrollArea className="h-[calc(100vh-230px)] rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                {placeholderTopStories.map(story => renderStoryCard(story, 'popular'))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="profile" className="mt-0">
            <ProfilePage />
          </TabsContent>
        </Tabs>
      </main>

      {selectedStoryForDetail && (
        <Dialog open={!!selectedStoryForDetail} onOpenChange={() => setSelectedStoryForDetail(null)}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-card rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="pt-2 pr-12">
              <DialogTitle className="text-2xl md:text-3xl text-primary line-clamp-2">{selectedStoryForDetail.title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pt-1">
                Автор: {selectedStoryForDetail.author}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-md">
                <Image 
                  src={selectedStoryForDetail.image} 
                  alt={selectedStoryForDetail.title} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 50vw"
                  style={{objectFit:"cover"}}
                  data-ai-hint={selectedStoryForDetail.dataAiHint}
                />
              </div>
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedStoryForDetail.description}
              </p>
              {selectedStoryForDetail.keywords && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Ключевые слова:</span> {selectedStoryForDetail.keywords}
                </p>
              )}
            </div>
            <DialogFooter className="pt-4 border-t mt-2">
              <Button variant="outline" onClick={() => setSelectedStoryForDetail(null)} disabled={isStartingGame}>
                Закрыть
              </Button>
              <Button onClick={handleStartStoryFromDetail} disabled={isStartingGame} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isStartingGame ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                Играть в эту историю
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showMainActionDialog} onOpenChange={setShowMainActionDialog}>
        <DialogContent className="sm:max-w-[425px] bg-card rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary text-center">Что желаете?</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              Начните новую главу или вернитесь к незавершенным делам.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-6">
            <Button
              onClick={handleOpenNewGameDialog}
              className="py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center justify-center gap-3"
            >
              <Rocket size={24} /> Начать новую историю
            </Button>
            <Button
              onClick={handleOpenLoadGameDialog}
              variant="outline"
              className="py-6 text-lg shadow-sm flex items-center justify-center gap-3"
            >
              <FolderOpen size={24} /> Загрузить историю
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <DialogContent className="sm:max-w-2xl bg-card rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Создание Нового Мира</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Опишите вселенную, в которой начнется ваше приключение. Чем детальнее описание, тем интереснее будет история.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4">
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="newGameStoryTitle" className="text-foreground">Название вашей истории (необязательно)</Label>
                <Input
                  id="newGameStoryTitle"
                  placeholder="Название вашей истории..."
                  value={newGameStoryTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGameStoryTitle(e.target.value)}
                  className="mt-1 text-sm rounded-md shadow-sm focus:ring-2 focus:ring-primary"
                  aria-label="Название истории для новой игры"
                  disabled={isStartingGame}
                />
              </div>
              <div>
                 <Label htmlFor="customInitialPrompt" className="text-foreground">Основное описание мира/завязка *</Label>
                <Textarea
                  id="customInitialPrompt"
                  placeholder="Например: 'Высокотехнологичный город Элизиум, парящий над отравленной Землей...' или 'Древний лес Фангорн...'"
                  value={customInitialPrompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCustomInitialPrompt(e.target.value)}
                  className="mt-1 min-h-[120px] text-sm rounded-md shadow-sm focus:ring-2 focus:ring-primary"
                  aria-label="Описание вселенной для новой игры"
                  disabled={isStartingGame}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newGamePlayerName" className="text-foreground">Имя вашего персонажа</Label>
                  <Input id="newGamePlayerName" placeholder="Алекс, Лиара..." value={newGamePlayerName} onChange={(e) => setNewGamePlayerName(e.target.value)} disabled={isStartingGame} className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="newGamePlayerRace" className="text-foreground">Раса персонажа</Label>
                  <Input id="newGamePlayerRace" placeholder="Человек, Эльф, Робот..." value={newGamePlayerRace} onChange={(e) => setNewGamePlayerRace(e.target.value)} disabled={isStartingGame} className="mt-1"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newGamePlayerSocialStatus" className="text-foreground">Социальное положение</Label>
                  <Input id="newGamePlayerSocialStatus" placeholder="Король, Изгнанник, Торговец..." value={newGamePlayerSocialStatus} onChange={(e) => setNewGamePlayerSocialStatus(e.target.value)} disabled={isStartingGame} className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="newGameEventTimeDetails" className="text-foreground">Время и место событий</Label>
                  <Input id="newGameEventTimeDetails" placeholder="Средневековье, 1250 год, зима" value={newGameEventTimeDetails} onChange={(e) => setNewGameEventTimeDetails(e.target.value)} disabled={isStartingGame} className="mt-1"/>
                </div>
              </div>
               <div>
                  <Label htmlFor="newGameUniverseName" className="text-foreground">Название вселенной</Label>
                  <Input id="newGameUniverseName" placeholder="Моя вселенная, Забытые Королевства, Марвел" value={newGameUniverseName} onChange={(e) => setNewGameUniverseName(e.target.value)} disabled={isStartingGame} className="mt-1"/>
                </div>
              <div>
                <Label htmlFor="newGameCustomAdditions" className="text-foreground">Ваши особые добавления к миру</Label>
                <Textarea
                  id="newGameCustomAdditions"
                  placeholder="Например: 'В этом мире магия запрещена', 'Главный злодей - дракон по имени Игниc...'"
                  value={newGameCustomAdditions}
                  onChange={(e) => setNewGameCustomAdditions(e.target.value)}
                  className="mt-1 min-h-[80px] text-sm"
                  disabled={isStartingGame}
                />
              </div>
              <div>
                <Label htmlFor="newGameKeywords" className="text-foreground">Ключевые слова (через запятую)</Label>
                <Input 
                  id="newGameKeywords"
                  placeholder="фэнтези, драконы, магия" 
                  className="mt-1 text-sm"
                  value={newGameKeywords}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGameKeywords(e.target.value)}
                  aria-label="Ключевые слова для новой истории"
                  disabled={isStartingGame}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowNewGameDialog(false)} disabled={isStartingGame}>Отмена</Button>
            <Button onClick={handleStartNewGameSubmit} disabled={isStartingGame || customInitialPrompt.trim() === ''} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isStartingGame ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Rocket className="mr-2 h-5 w-5" />}
              Начать приключение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadGameDialog} onOpenChange={setShowLoadGameDialog}>
        <DialogContent className="sm:max-w-md md:max-w-lg bg-card rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Загрузить Сохраненную Игру</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Выберите одну из ваших предыдущих историй, чтобы продолжить с того места, где остановились.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingSaves ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : availableSaves.length > 0 ? (
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="space-y-3">
                  {availableSaves.map((save) => (
                    <Button
                      key={save.key}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-4 flex flex-col items-start hover:bg-muted/50 rounded-lg shadow-sm transition-all duration-200"
                      onClick={() => handleLoadGameSelect(save.key)}
                      aria-label={`Загрузить историю: ${save.name}`}
                    >
                      <span className="font-semibold text-card-foreground text-base">{save.name}</span>
                      <span className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{save.preview}</span>
                      {save.metadata.isPublished && (
                        <span className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Опубликовано</span>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground py-10 space-y-2">
                <BookOpen size={48} className="mx-auto text-gray-400"/>
                <p>У вас пока нет сохраненных игр.</p>
                <p className="text-sm">Время начать новое приключение!</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadGameDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isStartingGame && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-xl text-muted-foreground">Создаем ваш мир...</p>
        </div>
      )}
    </div>
  );
}
