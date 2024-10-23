'use client';

import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect, useState } from 'react';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="cursor-pointer" />;
  }

  return (
    <div
      className="cursor-pointer"
      onClick={() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }}
    >
      {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
    </div>
  );
}
