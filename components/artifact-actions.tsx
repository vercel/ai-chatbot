/**
 * @file components/artifact-actions.tsx
 * @description Компонент с действиями для артефакта.
 * @version 1.3.0
 * @date 2025-06-06
 * @updated Логика кнопки "Обсудить в чате" вынесена на новый API эндпоинт.
 */

/** HISTORY:
 * v1.3.0 (2025-06-06): Кнопка "Обсудить" теперь вызывает /api/chat/discuss-artifact.
 * v1.2.0 (2025-06-06): Исправлен маршрут для кнопки "Обсудить в чате" с /chat/new на /
 * v1.1.0 (2025-06-05): Добавлена кнопка "Discuss in Chat".
 * v1.0.0 (2025-06-05): Начальная версия.
 */

import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { artifactDefinitions, UIArtifact } from './artifact';
import { Dispatch, memo, SetStateAction, useState } from 'react';
import { ArtifactActionContext } from './create-artifact';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MessageCircleIcon } from './icons';
import { useRouter, usePathname } from 'next/navigation';

interface ArtifactActionsProps {
  artifact: UIArtifact;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
  metadata: any;
  setMetadata: Dispatch<SetStateAction<any>>;
}

function PureArtifactActions({
  artifact,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  metadata,
  setMetadata,
}: ArtifactActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  const actionContext: ArtifactActionContext = {
    content: artifact.content,
    handleVersionChange,
    currentVersionIndex,
    isCurrentVersion,
    mode,
    metadata,
    setMetadata,
  };

  const handleDiscuss = () => {
    const isAlreadyInChat = pathname.startsWith('/chat/');
    const chatId = isAlreadyInChat ? pathname.split('/').pop() : undefined;

    let apiUrl = `/api/chat/discuss-artifact?artifactId=${artifact.documentId}`;
    if (chatId) {
      apiUrl += `&chatId=${chatId}`;
    }

    // Используем router.push для перехода, т.к. API вернет редирект
    router.push(apiUrl);
  };

  return (
    <div className="flex flex-row gap-1">
       <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="h-fit p-2 dark:hover:bg-zinc-700"
              onClick={handleDiscuss}
              disabled={isLoading || artifact.status === 'streaming'}
            >
              <MessageCircleIcon size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Обсудить в чате</TooltipContent>
        </Tooltip>

      {artifactDefinition.actions.map((action) => (
        <Tooltip key={action.description}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn('h-fit dark:hover:bg-zinc-700', {
                'p-2': !action.label,
                'py-1.5 px-2': action.label,
              })}
              onClick={async () => {
                setIsLoading(true);

                try {
                  await Promise.resolve(action.onClick(actionContext));
                } catch (error) {
                  toast.error('Failed to execute action');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={
                isLoading || artifact.status === 'streaming'
                  ? true
                  : action.isDisabled
                    ? action.isDisabled(actionContext)
                    : false
              }
            >
              {action.icon}
              {action.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.description}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export const ArtifactActions = memo(
  PureArtifactActions,
  (prevProps, nextProps) => {
    if (prevProps.artifact.status !== nextProps.artifact.status) return false;
    if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
      return false;
    if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;
    if (prevProps.artifact.content !== nextProps.artifact.content) return false;

    return true;
  },
);

// END OF: components/artifact-actions.tsx
