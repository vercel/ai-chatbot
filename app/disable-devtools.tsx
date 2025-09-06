'use client';

import { useEffect } from 'react';

export function DisableDevTools() {
  useEffect(() => {
    // Desabilitar React DevTools em produção e desenvolvimento
    if (typeof window !== 'undefined') {
      // Configurar para ocultar DevTools
      if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = true;
      }
      
      // Salvar preferência no localStorage
      try {
        localStorage.setItem('hideDevTools', 'true');
        localStorage.setItem('hideDevToolsUntil', String(Date.now() + 86400000)); // 24 horas
      } catch (e) {
        // Ignorar erros de localStorage
      }
      
      // Desabilitar mensagens de console em produção
      if (process.env.NODE_ENV === 'production') {
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};
        console.info = () => {};
      }
    }
  }, []);

  return null;
}