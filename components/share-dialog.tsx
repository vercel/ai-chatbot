/**
 * @file components/share-dialog.tsx
 * @description Диалоговое окно для управления публикацией и копирования ссылки на чат.
 * @version 2.0.0
 * @date 2025-06-06
 * @updated Полный редизайн UX. Убрана лишняя кнопка. Кнопка "Копировать" теперь делает чат публичным.
 */

/** HISTORY:
 * v2.0.0 (2025-06-06): Редизайн UX в соответствии с новыми требованиями.
 * v1.0.0 (2025-06-05): Начальная версия компонента.
 */
'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyIcon } from '@/components/icons';
import { toast } from '@/components/toast';
import { updateChatVisibility } from '@/app/(main)/chat/actions';
import type { VisibilityType } from '@/lib/types';

interface ShareDialogProps {
  chatId: string;
  visibility: VisibilityType;
  onVisibilityChange: (newVisibility: VisibilityType) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
  chatId,
  visibility,
  onVisibilityChange,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/chat/${chatId}`);
    }
  }, [chatId]);

  const handleShareAndCopy = async () => {
    const isAlreadyPublic = visibility === 'public';
    if (!isAlreadyPublic) {
      await updateChatVisibility({ chatId, visibility: 'public' });
      onVisibilityChange('public');
    }
    navigator.clipboard.writeText(shareUrl);
    toast({
      type: 'success',
      description: isAlreadyPublic
        ? 'Ссылка скопирована в буфер обмена.'
        : 'Ссылка скопирована. Чат теперь публичный.',
    });
  };

  const handleStopSharing = async () => {
    await updateChatVisibility({ chatId, visibility: 'private' });
    onVisibilityChange('private');
    toast({ type: 'success', description: 'Доступ к чату закрыт.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Поделиться чатом</DialogTitle>
          <DialogDescription>
            Любой, у кого есть эта ссылка, сможет просматривать этот чат.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Ссылка
            </Label>
            <Input id="link" defaultValue={shareUrl} readOnly />
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleShareAndCopy}>
            <span className="sr-only">Копировать</span>
            <CopyIcon />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
           {visibility === 'public' ? (
             <Button type="button" variant="destructive" onClick={handleStopSharing}>
              Закрыть доступ
            </Button>
          ) : (
             <Button type="button" onClick={handleShareAndCopy}>
              Поделиться и скопировать
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// END OF: components/share-dialog.tsx
