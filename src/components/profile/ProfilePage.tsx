
// src/components/profile/ProfilePage.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Gem, Award, Edit2, Save, Upload, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GameMetadata } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  saveUserProfile, 
  loadUserProfile, 
  saveAchievements, 
  loadAchievements, 
  type UserProfile, 
  type Achievement 
} from '@/services/userProfileService';
import { loadAllGameSlots, updateGameMetadata } from '@/services/gameDataService';


const initialAchievementsList: Achievement[] = [
  // Existing modified
  { id: 'walk10', name: 'Первые шаги', description: 'Пройти 10 шагов в любой истории.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 10 },
  { id: 'walk100', name: 'Путешественник', description: 'Пройти 100 шагов в сумме по всем историям.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 100 },
  { id: 'storyStart1', name: 'Начало Легенды', description: 'Начать свою первую историю.', icon: <Award size={24} />, unlocked: false },
  { id: 'storyStart5', name: 'Сказитель', description: 'Начать 5 разных историй.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 5 },
  { id: 'actionDo10', name: 'Деятель', description: 'Совершить 10 действий типа "Действовать".', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 10 },
  { id: 'editHistory1', name: 'Летописец', description: 'Использовать функцию "Писать историю" 1 раз.', icon: <Award size={24} />, unlocked: false },
  { id: 'gameLoaded1', name: 'Возвращение Героя', description: 'Загрузить сохраненную игру.', icon: <Award size={24} />, unlocked: false },
  { id: 'profileEdit1', name: 'Новое Лицо', description: 'Отредактировать свой профиль.', icon: <Award size={24} />, unlocked: false },
  { id: 'exploreAllTabs', name: 'Любопытный Исследователь', description: 'Посетить все основные вкладки приложения.', icon: <Award size={24} />, unlocked: false },
  { id: 'firstSave', name: 'Хранитель Прогресса', description: 'Игра успешно сохранилась в первый раз.', icon: <Award size={24} />, unlocked: false },

  // New Achievements
  // Progression & Story Length
  { id: 'walk500', name: 'Марафонец', description: 'Пройти 500 шагов в одной истории.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 500 },
  { id: 'walk1000_total', name: 'Эпический Рассказчик', description: 'Пройти 1000 шагов суммарно по всем историям.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 1000 },
  { id: 'storyWriteLong', name: 'Слово Мастера', description: 'Написать сегмент истории через "ПисатьИсторию" длиннее 200 символов.', icon: <Award size={24} />, unlocked: false },

  // Story Creation & Variety
  { id: 'storyStart10', name: 'Архивариус', description: 'Начать 10 разных историй.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 10 },
  { id: 'storyStart25', name: 'Библиотекарь Миров', description: 'Начать 25 разных историй.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 25 },
  { id: 'customUniverse', name: 'Свой Мир', description: 'Создать историю с уникальным названием вселенной.', icon: <Award size={24} />, unlocked: false },
  { id: 'customAdditionsUser', name: 'Кастомизатор', description: 'Использовать поле "Ваши особые добавления к миру" при создании истории.', icon: <Award size={24} />, unlocked: false },
  { id: 'fullCharacterCreate', name: 'Деталист', description: 'Заполнить имя, расу и соц. статус персонажа при создании новой игры.', icon: <Award size={24} />, unlocked: false },
  { id: 'keywordsAdded', name: 'Тег Мастер', description: 'Добавить ключевые слова при создании новой истории.', icon: <Award size={24} />, unlocked: false },
  { id: 'keywordsByAI', name: 'Муза ИИ', description: 'Получить ключевые слова, сгенерированные ИИ для вашей истории.', icon: <Award size={24} />, unlocked: false },

  // Player Actions
  { id: 'actionDo50', name: 'Активист', description: 'Совершить 50 действий типа "Действовать".', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 50 },
  { id: 'actionDo200', name: 'Проактивный Герой', description: 'Совершить 200 действий типа "Действовать".', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 200 },
  { id: 'editHistory10', name: 'Соавтор', description: 'Использовать функцию "Писать историю" 10 раз.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 10 },
  { id: 'editHistory50', name: 'Главный Сценарист', description: 'Использовать функцию "Писать историю" 50 раз.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 50 },
  { id: 'continueStory25', name: 'Решительный', description: 'Использовать "ПродолжитьСюжет" 25 раз.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 25 },
  { id: 'continueStory100', name: 'Двигатель Прогресса', description: 'Использовать "ПродолжитьСюжет" 100 раз.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 100 },

  // Game Mechanics & Meta
  { id: 'gameLoad10', name: 'Частый Гость', description: 'Загрузить игру 10 раз.', icon: <Award size={24} />, unlocked: false, progress: 0, goal: 10 },
  { id: 'storyPublish1', name: 'Публицист', description: 'Опубликовать свою первую историю.', icon: <Award size={24} />, unlocked: false },
  { id: 'storyDetailsEdit', name: 'Редактор Судьбы', description: 'Отредактировать детали активной истории (название, описание и т.д.).', icon: <Award size={24} />, unlocked: false },
  { id: 'avatarSet', name: 'Стильный Аватар', description: 'Установить URL аватара в профиле (путем редактирования профиля).', icon: <Award size={24} />, unlocked: false },
];


export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({ username: 'Игрок', gameName: 'Герой', avatarUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievementsList);
  const { toast } = useToast();
  const [userStories, setUserStories] = useState<{[key: string]: GameMetadata & {key: string}}>({});

  useEffect(() => {
    const fetchData = async () => {
      const loadedProfile = await loadUserProfile();
      if (loadedProfile) {
        setProfile(loadedProfile);
      }

      const loadedUserAchievements = await loadAchievements(initialAchievementsList);
      setAchievements(loadedUserAchievements);

      try {
        const allSaves = await loadAllGameSlots();
        const storiesMetadata: { [key: string]: GameMetadata & {key: string} } = {};
        Object.entries(allSaves).forEach(([key, slot]) => {
          if (slot?.metadata) {
            storiesMetadata[key] = { ...slot.metadata, key: key };
          }
        });
        setUserStories(storiesMetadata);
      } catch (error) {
        console.error("Error loading user stories for profile:", error);
        toast({ title: "Ошибка", description: "Не удалось загрузить ваши истории.", variant: "destructive" });
      }
    };
    fetchData();
  }, [toast]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      await saveUserProfile(profile);
      if (profile.avatarUrl && profile.avatarUrl.trim() !== '') {
        await unlockAchievement('avatarSet');
      }
      await unlockAchievement('profileEdit1');
      setIsEditing(false);
      toast({ title: "Профиль обновлен", description: "Ваши данные успешно сохранены." });
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить профиль.", variant: "destructive" });
    }
  };

  const unlockAchievement = useCallback(async (achievementId: string, incrementAmount?: number) => {
    let achievementUnlockedThisTime = false;
    let achievementUpdated = false;

    const updatedAchievements = achievements.map(ach => {
      if (ach.id === achievementId) {
        achievementUpdated = true;
        if (ach.unlocked) return ach; // Already unlocked

        if (ach.goal) { // Progress-based achievement
          const currentProgress = (ach.progress || 0) + (incrementAmount || 1);
          if (currentProgress >= ach.goal) {
            achievementUnlockedThisTime = true;
            return { ...ach, unlocked: true, progress: ach.goal };
          }
          return { ...ach, progress: currentProgress };
        } else { // Simple unlock
          achievementUnlockedThisTime = true;
          return { ...ach, unlocked: true };
        }
      }
      return ach;
    });

    if (achievementUpdated) {
      setAchievements(updatedAchievements);
      try {
        await saveAchievements(updatedAchievements);
        if (achievementUnlockedThisTime) {
          const unlockedAch = updatedAchievements.find(ach => ach.id === achievementId);
          if (unlockedAch) {
            toast({ title: "Достижение разблокировано!", description: `Вы открыли: ${unlockedAch.name}` });
          }
        }
      } catch (error) {
        console.error("Failed to save achievements after unlocking/progressing:", error);
      }
    }
  }, [achievements, toast]);


  const handlePublishStory = async (storyKey: string) => {
    try {
      await updateGameMetadata(storyKey, { isPublished: true });
      await unlockAchievement('storyPublish1');
      setUserStories(prevStories => {
        const updatedStories = { ...prevStories };
        if (updatedStories[storyKey]) {
          updatedStories[storyKey].isPublished = true;
        }
        return updatedStories;
      });
      toast({ title: "История опубликована", description: "Ваша история теперь видна другим игрокам в разделе 'Обзор'.", });
    } catch (error) {
      console.error("Error publishing story:", error);
      toast({ title: "Ошибка", description: "Не удалось опубликовать историю.", variant: "destructive" });
    }
  };

  // Example function to call when an achievement-triggering event happens
  // This would be called from other parts of the app, e.g., after a story step.
  // const recordGameStep = async () => {
  //   await unlockAchievement('walk10', 1);
  //   await unlockAchievement('walk100', 1);
  //   await unlockAchievement('walk500', 1); 
  //   await unlockAchievement('walk1000_total', 1);
  // };


  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <Card className="w-full max-w-3xl mx-auto shadow-xl rounded-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary shadow-md">
              <AvatarImage src={profile.avatarUrl || `https://picsum.photos/seed/${profile.username}/100`} alt={profile.username} data-ai-hint="profile avatar" />
              <AvatarFallback className="text-3xl">
                {profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          {isEditing ? (
            <Input
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              className="text-2xl font-bold text-center mb-2"
              aria-label="Имя пользователя"
            />
          ) : (
            <CardTitle className="text-3xl font-bold text-primary">{profile.username}</CardTitle>
          )}
          {isEditing ? (
            <div className="space-y-2">
               <Input
                name="gameName"
                value={profile.gameName}
                onChange={handleProfileChange}
                className="text-lg text-muted-foreground text-center"
                placeholder="Ваше игровое имя"
                aria-label="Игровое имя"
              />
              <Input
                name="avatarUrl"
                value={profile.avatarUrl || ''}
                onChange={handleProfileChange}
                className="text-sm text-muted-foreground text-center"
                placeholder="URL аватара (необязательно)"
                aria-label="URL аватара"
              />
            </div>
          ) : (
            <CardDescription className="text-lg text-muted-foreground">
              Игровое имя: {profile.gameName}
            </CardDescription>
          )}
          <div className="mt-4">
            {isEditing ? (
              <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save size={18} className="mr-2" /> Сохранить
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit2 size={18} className="mr-2" /> Редактировать профиль
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="achievements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="achievements"><Award className="mr-2" /> Достижения</TabsTrigger>
              <TabsTrigger value="inventory"><Gem className="mr-2" /> Инвентарь</TabsTrigger>
              <TabsTrigger value="user-stories"><BookOpen className="mr-2" /> Мои истории</TabsTrigger>
            </TabsList>
            <TabsContent value="achievements" className="mt-6">
              <ScrollArea className="h-[50vh] pr-2"> {/* Max height for scrollability */}
                <div className="space-y-4">
                  {achievements.map(ach => (
                    <Card key={ach.id} className={cn('p-4 rounded-lg transition-all', ach.unlocked ? 'bg-secondary/10 border-secondary shadow-sm' : 'bg-muted/20 border-border')}>
                      <div className="flex items-center gap-4">
                        <div className={cn('p-2 rounded-full', ach.unlocked ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground')}>
                          {ach.icon || <Award size={24} />} {/* Fallback icon */}
                        </div>
                        <div>
                          <h3 className={cn('font-semibold', ach.unlocked ? 'text-secondary' : 'text-foreground')}>{ach.name}</h3>
                          <p className="text-sm text-muted-foreground">{ach.description}</p>
                          {ach.goal && (
                             <div className="mt-1">
                               <progress value={ach.progress} max={ach.goal} className="w-full h-2 rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"></progress>
                               <p className="text-xs text-muted-foreground">{ach.progress || 0} / {ach.goal}</p>
                             </div>
                          )}
                        </div>
                        {ach.unlocked && <CheckCircleIcon className="ml-auto text-green-500 flex-shrink-0" />}
                      </div>
                    </Card>
                  ))}
                   {achievements.length === 0 && <p className="text-center text-muted-foreground py-4">Достижений пока нет.</p>}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="inventory" className="mt-6">
              <div className="text-center py-10">
                <Shield size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Инвентарь пока пуст.</p>
                <p className="text-sm text-muted-foreground">Предметы, которые вы найдете в своих приключениях, появятся здесь.</p>
              </div>
            </TabsContent>
            <TabsContent value="user-stories" className="mt-6">
              <ScrollArea className="h-[60vh] pr-2"> {/* Max height for scrollability */}
                {Object.keys(userStories).length === 0 ? (
                  <div className="text-center text-muted-foreground py-10 space-y-2">
                    <BookOpen size={48} className="mx-auto text-gray-400" />
                    <p>У вас пока нет созданных историй.</p>
                    <p className="text-sm">Время начать новое приключение!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.values(userStories).map((story) => (
                      <Card key={story.key} className="shadow-sm rounded-lg overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl text-primary">{story.storyTitle}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">{story.storyDescription || 'Нет описания.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground pb-3">
                           Ключевые слова: {story.keywords || 'не указаны'}
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-3">
                          <Button
                            variant={story.isPublished ? "outline" : "default"}
                            size="sm"
                            onClick={() => handlePublishStory(story.key)}
                            disabled={story.isPublished}
                            className={cn(story.isPublished ? "cursor-not-allowed" : "bg-accent hover:bg-accent/90 text-accent-foreground")}
                          >
                            {story.isPublished ? <><CheckCircleIcon className="mr-2 h-4 w-4"/>Опубликовано</> : <><Upload className="mr-2 h-4 w-4" />Опубликовать в "Обзор"</>}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

