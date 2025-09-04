import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
} from 'react';

// Tipo para tamanhos de fonte
type FontSizeType = 'normal' | 'large' | 'x-large';

// Interface para o estado de acessibilidade
interface AccessibilityState {
  highContrast: boolean;
  fontSize: FontSizeType;
  reduceMotion: boolean;
  announcements: string[];
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
      announcements: [],
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

    // Verificar preferências do sistema
    const checkSystemPreferences = () => {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (prefersReducedMotion && !reduceMotion) {
        setAccessibilityState((prev) => ({ ...prev, reduceMotion: true }));
      }
    };

    // Verificar preferências do sistema ao montar o componente
    checkSystemPreferences();

    // Recuperar configurações salvas
    const savedSettings = localStorage.getItem('ysh-accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAccessibilityState((prev) => ({
          ...prev,
          highContrast: parsed.highContrast ?? prev.highContrast,
          fontSize: parsed.fontSize ?? prev.fontSize,
          reduceMotion: parsed.reduceMotion ?? prev.reduceMotion,
        }));
      } catch (e) {
        console.error('Erro ao recuperar configurações de acessibilidade:', e);
      }
    }

    // Salvar configurações quando mudarem
    const saveSettings = () => {
      localStorage.setItem(
        'ysh-accessibility-settings',
        JSON.stringify({
          highContrast,
          fontSize,
          reduceMotion,
        }),
      );
    };

    saveSettings();
  }, [accessibilityState]);

  // Toggle para modo de alto contraste
  const toggleHighContrast = () => {
    setAccessibilityState((prev) => ({
      ...prev,
      highContrast: !prev.highContrast,
    }));
  };

  // Definir tamanho da fonte
  const setFontSize = (size: 'normal' | 'large' | 'x-large') => {
    setAccessibilityState((prev) => ({
      ...prev,
      fontSize: size,
    }));
  };

  // Toggle para redução de movimento
  const toggleReduceMotion = () => {
    setAccessibilityState((prev) => ({
      ...prev,
      reduceMotion: !prev.reduceMotion,
    }));
  };

  // Função para anunciar mensagens para leitores de tela
  const announce = (message: string) => {
    setAccessibilityState((prev) => ({
      ...prev,
      announcements: [...prev.announcements, message],
    }));

    // Remover mensagem após ser lida (tempo arbitrário para leitores de tela)
    setTimeout(() => {
      setAccessibilityState((prev) => ({
        ...prev,
        announcements: prev.announcements.filter((m) => m !== message),
      }));
    }, 3000);
  };

  // Memoize o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(
    () => ({
      ...accessibilityState,
      toggleHighContrast,
      setFontSize,
      toggleReduceMotion,
      announce,
    }),
    [accessibilityState],
  );

  // Memoize os anúncios para reduzir a profundidade da aninhação
  const announcements = useMemo(() => {
    return accessibilityState.announcements.map((announcement, index) => (
      <p key={`${index}-${announcement.slice(0, 10)}`}>{announcement}</p>
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

  return {
    announceRouteChange: (pageTitle: string) => {
      announce(`Navegou para ${pageTitle}`);
    },
  };
}

// Hook para anunciar atualizações de conteúdo
export function useContentAnnouncer() {
  const { announce } = useAccessibility();

  return {
    announceContentUpdate: (message: string) => {
      announce(message);
    },
  };
}
