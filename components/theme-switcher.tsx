/**
 * @file components/theme-switcher.tsx
 * @description Компонент для переключения режима отображения (светлый/темный/системный).
 * @version 1.1.1
 * @date 2024-07-12
 * @updated Переделан на использование ToggleGroup для более интуитивного выбора.
 * @updated Improved theme selection highlight via toggle component update.
 */

/** HISTORY:
 * v1.1.1 (2024-07-12): Improved theme selection highlight via toggle component update.
 * v1.1.0 (2025-06-05): Заменен DropdownMenu на ToggleGroup.
 * v1.0.0 (2025-06-05): Начальная версия компонента.
 */

'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SunIcon, MoonIcon, LaptopIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <TooltipProvider delayDuration={100}>
      <ToggleGroup
        type="single"
        variant="outline"
        value={theme}
        onValueChange={(value) => {
          if (value) setTheme(value);
        }}
        className="bg-background"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="light" aria-label="Light mode">
              <SunIcon size={16} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Светлый режим</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="dark" aria-label="Dark mode">
              <MoonIcon size={16} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Темный режим</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="system" aria-label="System mode">
              <LaptopIcon size={16} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Системный режим</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}

// END OF: components/theme-switcher.tsx
