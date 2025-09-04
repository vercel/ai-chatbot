import { useState, type FC } from 'react';
import { AccessibilitySettings } from './accessibility-settings';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface AccessibilityButtonProps {
  className?: string;
}

export const AccessibilityButton: FC<AccessibilityButtonProps> = ({
  className = '',
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`${className}`}
              onClick={() => setSettingsOpen(true)}
              aria-label="Configurações de acessibilidade"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-[1.2rem]"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Configurações de acessibilidade</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AccessibilitySettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
};
