'use client';

import { useKeyboardNavigation } from '@/lib/accessibility/keyboard';
import { useRouteAnnouncer } from '@/lib/accessibility/context';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AccessibilityListener() {
  // Hook para detectar navegação por teclado e aplicar estilos de foco apropriados
  useKeyboardNavigation();

  // Anunciar mudanças de rota para leitores de tela
  const { announceRouteChange } = useRouteAnnouncer();
  const pathname = usePathname();

  // Função para formatar o título da página fora do useEffect
  function getPageTitle(path: string): string {
    if (!path) return '';

    if (path === '/') {
      return 'Página inicial';
    }

    // Formatar o pathname para criar um título legível
    const segments = path
      .split('/')
      .filter((segment) => segment)
      .map((segment) => segment.replace(/-/g, ' '));

    if (segments.length > 0) {
      const title = segments.join(' - ');
      return title.charAt(0).toUpperCase() + title.slice(1);
    }

    return 'Página inicial';
  }

  // Efeito para anunciar mudanças de rota
  useEffect(() => {
    // Evitar anúncios desnecessários durante o carregamento inicial
    if (!pathname) return;

    // Usar um timeout para evitar anúncios durante navegações rápidas
    const pageTitle = getPageTitle(pathname);
    const timer = setTimeout(() => {
      if (pageTitle) {
        announceRouteChange(pageTitle);
      }
    }, 300); // Aumentado para 300ms para dar mais tempo à renderização

    return () => clearTimeout(timer);
  }, [pathname, announceRouteChange]);

  return null;
}
