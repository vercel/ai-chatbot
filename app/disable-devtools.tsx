'use client';

import { useEffect, useState } from 'react';

export function DisableDevTools() {
  const [devToolsHidden, setDevToolsHidden] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Função para alternar DevTools
      const toggleDevTools = () => {
        const newState = !devToolsHidden;
        setDevToolsHidden(newState);
        
        if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
          (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = newState;
        }
        
        // Salvar preferência
        try {
          localStorage.setItem('hideDevTools', String(newState));
          if (newState) {
            localStorage.setItem('hideDevToolsUntil', String(Date.now() + 86400000)); // 24 horas
            // Mostrar notificação
            const notification = document.createElement('div');
            notification.innerHTML = '🔒 DevTools ocultado (Ctrl+Shift+D para mostrar)';
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #1e293b;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-family: system-ui;
              font-size: 14px;
              z-index: 999999;
              animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
          } else {
            // Mostrar notificação
            const notification = document.createElement('div');
            notification.innerHTML = '🔓 DevTools ativado (Ctrl+Shift+D para ocultar)';
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #22c55e;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-family: system-ui;
              font-size: 14px;
              z-index: 999999;
              animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
          }
        } catch (e) {
          // Ignorar erros
        }
        
        // Recarregar console functions se estiver mostrando
        if (!newState && process.env.NODE_ENV === 'production') {
          // Restaurar console
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
          if (iframe.contentWindow) {
            const iframeConsole = (iframe.contentWindow as any).console;
            if (iframeConsole) {
              console.log = iframeConsole.log;
              console.warn = iframeConsole.warn;
              console.error = iframeConsole.error;
              console.info = iframeConsole.info;
            }
          }
          iframe.remove();
        }
      };

      // Listener para tecla de atalho: Ctrl+Shift+D (ou Cmd+Shift+D no Mac)
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          toggleDevTools();
        }
      };

      // Adicionar listener
      window.addEventListener('keydown', handleKeyDown);

      // Configuração inicial - ocultar por padrão
      if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = true;
      }
      
      // Carregar preferência salva
      try {
        const saved = localStorage.getItem('hideDevTools');
        if (saved === 'false') {
          setDevToolsHidden(false);
          if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
            (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = false;
          }
        }
      } catch (e) {
        // Ignorar erros
      }
      
      // Desabilitar console em produção se DevTools estiver oculto
      if (process.env.NODE_ENV === 'production' && devToolsHidden) {
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};
        console.info = () => {};
      }

      // Adicionar estilos de animação
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        style.remove();
      };
    }
  }, [devToolsHidden]);

  return null;
}