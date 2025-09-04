'use client';

import { useAccessibility } from '@/lib/accessibility/context';
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
  
  // Efeito para anunciar mudanças de rota
  useEffect(() => {
    // Obter o título da página baseado na rota
    let pageTitle = 'Nova página';
    
    if (pathname === '/') {
      pageTitle = 'Página inicial';
    } else {
      // Formatar o pathname para criar um título legível
      pageTitle = pathname
        .split('/')
        .filter(segment => segment)
        .map(segment => segment.replace(/-/g, ' '))
        .join(' - ');
      
      if (pageTitle) {
        pageTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
      } else {
        pageTitle = 'Página inicial';
      }
    }
    
    announceRouteChange(pageTitle);
  }, [pathname, announceRouteChange]);
  
  return null;
}