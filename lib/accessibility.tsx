'use client';

import * as React from 'react';

// Contexto para configurações de acessibilidade
type AccessibilityContextType = {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  fontSize: 'normal' | 'large' | 'x-large';
  setFontSize: (size: 'normal' | 'large' | 'x-large') => void;
  motionReduced: boolean;
  setMotionReduced: (value: boolean) => void;
  screenReaderAnnounce: (message: string) => void;
};

const AccessibilityContext = React.createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Estados para configurações de acessibilidade
  const [highContrast, setHighContrast] = React.useState<boolean>(false);
  const [fontSize, setFontSize] = React.useState<
    'normal' | 'large' | 'x-large'
  >('normal');
  const [motionReduced, setMotionReduced] = React.useState<boolean>(false);

  // Referência para anúncios de leitores de tela
  const announcer = React.useRef<HTMLDivElement | null>(null);

  // Anuncia mensagens para leitores de tela
  const screenReaderAnnounce = (message: string) => {
    if (announcer.current) {
      announcer.current.textContent = '';
      // Pequeno atraso para garantir que o leitor de tela capte a mudança
      setTimeout(() => {
        if (announcer.current) {
          announcer.current.textContent = message;
        }
      }, 50);
    }
  };

  // Aplicar classes CSS baseadas nas configurações
  React.useEffect(() => {
    // Aplicar configurações de alto contraste
    document.documentElement.classList.toggle('high-contrast', highContrast);

    // Aplicar configurações de tamanho de fonte
    document.documentElement.classList.remove(
      'font-size-normal',
      'font-size-large',
      'font-size-x-large',
    );
    document.documentElement.classList.add(`font-size-${fontSize}`);

    // Aplicar configurações de redução de movimento
    document.documentElement.classList.toggle('motion-reduced', motionReduced);

    // Verificar preferências do sistema
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion && !motionReduced) {
      setMotionReduced(true);
    }
  }, [highContrast, fontSize, motionReduced]);

  // Valor do contexto
  const contextValue = React.useMemo(
    () => ({
      highContrast,
      setHighContrast,
      fontSize,
      setFontSize,
      motionReduced,
      setMotionReduced,
      screenReaderAnnounce,
    }),
    [highContrast, fontSize, motionReduced],
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Elemento invisível para anúncios de leitores de tela */}
      <div
        ref={announcer}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      />

      {children}
    </AccessibilityContext.Provider>
  );
}

// Hook para usar o contexto de acessibilidade
export function useAccessibility() {
  const context = React.useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider',
    );
  }
  return context;
}
