// src/components/game/EditStoryDetailsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { GameMetadata } from '@/types/game';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface EditStoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMetadata: GameMetadata;
  onSave: (updatedMetadata: GameMetadata) => void;
}

export default function EditStoryDetailsModal({ isOpen, onClose, gameMetadata, onSave }: EditStoryDetailsModalProps) {
  const [editableMetadata, setEditableMetadata] = useState<GameMetadata>(gameMetadata);

  useEffect(() => {
    setEditableMetadata({
      storyTitle: gameMetadata.storyTitle || '',
      storyDescription: gameMetadata.storyDescription || '',
      characterName: gameMetadata.characterName || '', // Retained for legacy/general use
      characterAppearance: gameMetadata.characterAppearance || '',
      characterPowers: gameMetadata.characterPowers || '',
      isPublished: gameMetadata.isPublished || false,
      keywords: gameMetadata.keywords || '',
      // New fields
      playerName: gameMetadata.playerName || '',
      playerRace: gameMetadata.playerRace || '',
      playerSocialStatus: gameMetadata.playerSocialStatus || '',
      eventTimeDetails: gameMetadata.eventTimeDetails || '',
      universeName: gameMetadata.universeName || '',
      customAdditions: gameMetadata.customAdditions || '',
    });
  }, [gameMetadata, isOpen]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setEditableMetadata(prev => ({ ...prev, isPublished: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editableMetadata);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Редактировать детали истории</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Измените название, описание и другие подробности вашей текущей истории.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[65vh] p-1 pr-3">
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="storyTitle" className="text-foreground">Название истории</Label>
                <Input
                  id="storyTitle"
                  name="storyTitle"
                  value={editableMetadata.storyTitle}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Захватывающее название..."
                />
              </div>
              <div>
                <Label htmlFor="storyDescription" className="text-foreground">Описание истории</Label>
                <Textarea
                  id="storyDescription"
                  name="storyDescription"
                  value={editableMetadata.storyDescription}
                  onChange={handleChange}
                  className="mt-1 min-h-[100px]"
                  placeholder="Краткое описание вашего мира и приключения..."
                />
              </div>
               <div>
                <Label htmlFor="keywords" className="text-foreground">Ключевые слова (через запятую)</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  value={editableMetadata.keywords || ''}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="фэнтези, космос, детектив..."
                />
              </div>
              
              <h3 className="text-lg font-semibold text-primary pt-4 border-t mt-4">Детали Персонажа и Мира</h3>
              
              <div>
                <Label htmlFor="playerName" className="text-foreground">Имя вашего персонажа</Label>
                <Input id="playerName" name="playerName" value={editableMetadata.playerName || ''} onChange={handleChange} className="mt-1" placeholder="Имя вашего героя"/>
              </div>
              <div>
                <Label htmlFor="playerRace" className="text-foreground">Раса персонажа</Label>
                <Input id="playerRace" name="playerRace" value={editableMetadata.playerRace || ''} onChange={handleChange} className="mt-1" placeholder="Человек, Эльф, Андроид..."/>
              </div>
              <div>
                <Label htmlFor="playerSocialStatus" className="text-foreground">Социальное положение</Label>
                <Input id="playerSocialStatus" name="playerSocialStatus" value={editableMetadata.playerSocialStatus || ''} onChange={handleChange} className="mt-1" placeholder="Король, Отверженный, Ученый..."/>
              </div>
              <div>
                <Label htmlFor="characterAppearance" className="text-foreground">Внешний вид персонажа</Label>
                <Textarea id="characterAppearance" name="characterAppearance" value={editableMetadata.characterAppearance || ''} onChange={handleChange} className="mt-1 min-h-[80px]" placeholder="Описание внешности"/>
              </div>
              <div>
                <Label htmlFor="characterPowers" className="text-foreground">Силы/Способности персонажа</Label>
                <Textarea id="characterPowers" name="characterPowers" value={editableMetadata.characterPowers || ''} onChange={handleChange} className="mt-1 min-h-[80px]" placeholder="Магия, кибернетика, уникальные навыки..."/>
              </div>

              <h3 className="text-lg font-semibold text-primary pt-4 border-t mt-4">Детали Вселенной</h3>
              <div>
                <Label htmlFor="universeName" className="text-foreground">Название вселенной/мира</Label>
                <Input id="universeName" name="universeName" value={editableMetadata.universeName || ''} onChange={handleChange} className="mt-1" placeholder="Эльдория, Земля-616, Галактика Андромеда..."/>
              </div>
               <div>
                <Label htmlFor="eventTimeDetails" className="text-foreground">Время и контекст событий</Label>
                <Input id="eventTimeDetails" name="eventTimeDetails" value={editableMetadata.eventTimeDetails || ''} onChange={handleChange} className="mt-1" placeholder="Средневековье, год 1000, после Великой войны..."/>
              </div>
              <div>
                <Label htmlFor="customAdditions" className="text-foreground">Ваши особые добавления к миру</Label>
                <Textarea id="customAdditions" name="customAdditions" value={editableMetadata.customAdditions || ''} onChange={handleChange} className="mt-1 min-h-[80px]" placeholder="Здесь магия редка, технология запрещена..."/>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t mt-4">
                <Switch
                  id="isPublished"
                  checked={editableMetadata.isPublished}
                  onCheckedChange={handleSwitchChange}
                  aria-label="Опубликовать историю"
                />
                <Label htmlFor="isPublished" className={cn("text-foreground cursor-pointer", editableMetadata.isPublished && "text-primary")}>
                  {editableMetadata.isPublished ? "Опубликовано (видна в 'Обзоре')" : "Опубликовать в 'Обзор'"}
                </Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Сохранить изменения
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
