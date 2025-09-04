'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  useCallback,
} from 'react';

// Tipo para tamanhos de fonte
type FontSizeType = 'normal' | 'large' | 'x-large';

// Tipo para anúncios
interface Announcement {
  id: string;
  text: string;
}

// Interface para o estado de acessibilidade
interface AccessibilityState {
  highContrast: boolean;
  fontSize: FontSizeType;
  reduceMotion: boolean;
  announcements: Announcement[];
}

// Interface para o contexto de acessibilidade
interface AccessibilityContextType extends AccessibilityState {
  toggleHighContrast: () => void;
  setFontSize: (size: FontSizeType) => void;
  toggleReduceMotion: () => void;
  announce: (message: string) => void;
}

// Contexto de acessibilidade
const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

// Props para o provedor de acessibilidade
interface AccessibilityProviderProps {
  readonly children: ReactNode;
}

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  // Estado para configurações de acessibilidade
  const [accessibilityState, setAccessibilityState] =
    useState<AccessibilityState>({
      highContrast: false,
      fontSize: 'normal',
      reduceMotion: false,
      announcements: [], // inicializado como array vazio de Announcement
    });

  // Efeito para aplicar classes de acessibilidade ao documento
  useEffect(() => {
    const { highContrast, fontSize, reduceMotion } = accessibilityState;

    // Aplicar modo de alto contraste
    document.documentElement.classList.toggle('high-contrast', highContrast);

    // Aplicar tamanho de fonte
    document.documentElement.classList.remove(
      'font-size-normal',
      'font-size-large',
      'font-size-x-large',
    );
    document.documentElement.classList.add(`font-size-${fontSize}`);

    // Aplicar redução de movimento
    document.documentElement.classList.toggle('motion-reduced', reduceMotion);

    // Salvar configurações quando mudarem
    try {
      localStorage.setItem(
        'ysh-accessibility-settings',
        JSON.stringify({
          highContrast,
          fontSize,
          reduceMotion,
        }),
      );
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }, [
    accessibilityState.highContrast,
    accessibilityState.fontSize,
    accessibilityState.reduceMotion,
  ]);

  // Efeito separado para carregar preferências iniciais (executa apenas uma vez)
  useEffect(() => {
    // Verificar preferências do sistema
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // Recuperar configurações salvas
    const savedSettings = localStorage.getItem('ysh-accessibility-settings');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAccessibilityState((prev) => ({
          ...prev,
          highContrast: parsed.highContrast ?? prev.highContrast,
          fontSize: parsed.fontSize ?? prev.fontSize,
          reduceMotion:
            parsed.reduceMotion ?? (prev.reduceMotion || prefersReducedMotion),
        }));
      } catch (e) {
        console.error('Erro ao recuperar configurações de acessibilidade:', e);
        // Se falhou, pelo menos aplique as preferências do sistema
        if (prefersReducedMotion) {
          setAccessibilityState((prev) => ({ ...prev, reduceMotion: true }));
        }
      }
    } else if (prefersReducedMotion) {
      // Nenhuma configuração salva, mas o sistema prefere redução de movimento
      setAccessibilityState((prev) => ({ ...prev, reduceMotion: true }));
    }
  }, []);

  // Funções memoizadas para manipular o estado
  const toggleHighContrast = useCallback(() => {
    setAccessibilityState((prev) => ({
      ...prev,
      highContrast: !prev.highContrast,
    }));
  }, []);

  // Definir tamanho da fonte
  const setFontSize = useCallback((size: 'normal' | 'large' | 'x-large') => {
    setAccessibilityState((prev) => ({
      ...prev,
      fontSize: size,
    }));
  }, []);

  // Toggle para redução de movimento
  const toggleReduceMotion = useCallback(() => {
    setAccessibilityState((prev) => ({
      ...prev,
      reduceMotion: !prev.reduceMotion,
    }));
  }, []);

  // Função para anunciar mensagens para leitores de tela
  const announce = useCallback((message: string) => {
    // Validar se a mensagem existe e não está vazia
    if (!message || typeof message !== 'string') return;

    // Usar um ID único para cada anúncio (timestamp + string parcial)
    const announcementId = `${Date.now()}-${message.slice(0, 10)}`;

    // Adicionar mensagem com ID único
    setAccessibilityState((prev) => ({
      ...prev,
      announcements: [
        ...prev.announcements,
        { id: announcementId, text: message },
      ],
    }));

    // Remover mensagem após ser lida (tempo arbitrário para leitores de tela)
    setTimeout(() => {
      setAccessibilityState((prev) => {
        // Filtra a mensagem específica pelo ID
        return {
          ...prev,
          announcements: prev.announcements.filter(
            (a) => a.id !== announcementId,
          ),
        };
      });
    }, 3000);
  }, []);

  // Memoize o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(
    () => ({
      ...accessibilityState,
      toggleHighContrast,
      setFontSize,
      toggleReduceMotion,
      announce,
    }),
    [
      accessibilityState,
      toggleHighContrast,
      setFontSize,
      toggleReduceMotion,
      announce,
    ],
  );

  // Memoize os anúncios para reduzir a profundidade da aninhação
  const announcements = useMemo(() => {
    return accessibilityState.announcements.map((announcement) => (
      <p key={announcement.id}>{announcement.text}</p>
    ));
  }, [accessibilityState.announcements]);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Área para anúncios de leitores de tela */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements}
      </div>
    </AccessibilityContext.Provider>
  );
}

// Hook personalizado para usar o contexto de acessibilidade
export function useAccessibility() {
  const context = useContext(AccessibilityContext);

  if (context === undefined) {
    throw new Error(
      'useAccessibility deve ser usado dentro de um AccessibilityProvider',
    );
  }

  return context;
}

// Hook para anunciar alterações de rota para leitores de tela
export function useRouteAnnouncer() {
  const { announce } = useAccessibility();

  // Retorna um objeto com a função para anunciar mudanças de rota
  return {
    announceRouteChange: (pageTitle: string) => {
      if (pageTitle) {
        announce(`Navegou para ${pageTitle}`);
      }
    },
  };
}

// Hook para anunciar atualizações de conteúdo
export function useContentAnnouncer() {
  const { announce } = useAccessibility();

  // Retorna um objeto com a função para anunciar atualizações de conteúdo
  return {
    announceContentUpdate: (message: string) => {
      if (message) {
        announce(message);
      }
    },
  };
}
