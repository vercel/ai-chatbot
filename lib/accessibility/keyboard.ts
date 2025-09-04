import { useEffect } from 'react';

export function useKeyboardNavigation() {
  useEffect(() => {
    function handleFirstTab(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');

        // Remova o evento após detectar a primeira navegação por teclado
        window.removeEventListener('keydown', handleFirstTab);

        // Adicione um novo ouvinte para verificar cliques do mouse
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    }

    function handleMouseDownOnce() {
      document.body.classList.remove('user-is-tabbing');

      // Remova este ouvinte e restaure o ouvinte original de tab
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    }

    window.addEventListener('keydown', handleFirstTab);

    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDownOnce);
    };
  }, []);
}

// Este hook pode ser adicionado ao layout principal para detectar automaticamente
// usuários que navegam por teclado versus mouse e ajustar os estilos de foco de acordo.
