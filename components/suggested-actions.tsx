'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import { usePersona } from '@/lib/persona/context';
import { Suggestion } from './elements/suggestion';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const { mode } = usePersona();

  const ownerActions = [
    'Verifique se seu telhado é ideal para energia solar',
    'Simule sua economia com painéis solares',
    'Quanto custa instalar energia solar em casa?',
    'Faça upload da sua conta de luz para análise',
  ];

  const integratorActions = [
    'Gerencie múltiplos projetos solares com eficiência',
    'Execute análises avançadas de viabilidade fotovoltaica',
    'Como integrar a API do Google Cloud para simulações?',
    'Otimize o monitoramento de sistemas instalados',
  ];

  const suggestedActions = mode === 'integrator' ? integratorActions : ownerActions;

  return (
    <div data-testid="suggested-actions" className="grid sm:grid-cols-2 gap-2 w-full">
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
            key={suggestedAction}
          >
            <Suggestion
              suggestion={suggestedAction}
              onClick={(suggestion) => {
                window.history.replaceState({}, '', `/chat/${chatId}`);
                sendMessage({
                  role: 'user',
                  parts: [{ type: 'text', text: suggestion }],
                });
              }}
              className="text-left w-full h-auto whitespace-normal p-3"
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
