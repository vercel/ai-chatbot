# Task: Enhance Model Selector UI for LostMind AI

## Context
With the implementation of the Gemini models (Task 2.1), model configuration (Task 2.2), and model provider (Task 2.3), we now need to update the user interface to showcase these models in an intuitive and branded manner. The model selector is a critical component of the chat interface that allows users to switch between different AI models.

## Objective
Create an enhanced model selector UI that visually represents the capabilities and characteristics of each LostMind AI model, groups them by provider, and provides intuitive selection mechanisms with helpful tooltips and visual indicators.

## Requirements
- Create visual capability indicators for each model
- Group models by provider type with clear headers
- Design responsive selector that works on mobile and desktop
- Add tooltips with detailed model information
- Implement smooth transitions between model selections
- Ensure proper keyboard navigation and accessibility
- Follow LostMind branding (colors, gradients, styling)
- Include fallback for unavailable models
- Add visual feedback for selected model

## File Locations
- Primary: `/components/model-selector.tsx` - Main model selector component
- Primary: `/components/model-badge.tsx` - Model capability badges
- Primary: `/components/ui/tooltip.tsx` - Tooltip component
- Primary: `/components/ui/dropdown-menu.tsx` - Dropdown menu component
- Reference: `/lib/models.ts` - Model configuration
- Reference: `/styles/model-selector.css` - Custom styles (if needed)

## Implementation Guidelines

### 1. Model Badge Component
Create a component for model capability badges in `/components/model-badge.tsx`:

```tsx
'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { modelCapabilities } from '@/config/capabilities';

interface ModelBadgeProps {
  capability: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function ModelBadge({ capability, size = 'md', className }: ModelBadgeProps) {
  const capabilityInfo = modelCapabilities[capability];
  
  if (!capabilityInfo) return null;
  
  const Icon = capabilityInfo.icon;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn(
            'inline-flex items-center justify-center rounded-full',
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
            capability === 'reasoning' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            capability === 'vision' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            capability === 'coding' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
            capability === 'chat' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            capability === 'knowledge' && 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
            className
          )}>
            {Icon && <Icon className={cn(
              'size-3.5',
              size === 'sm' && 'size-3'
            )} />}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="font-medium">
          <div className="flex flex-col gap-1">
            <div className="font-medium">{capabilityInfo.name}</div>
            <div className="text-xs text-muted-foreground">{capabilityInfo.description}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### 2. Model Selector Component
Update the model selector component in `/components/model-selector.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { models, getModelById } from '@/lib/models';
import { useChat } from '@/lib/hooks/use-chat';
import { ModelBadge } from '@/components/model-badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ModelSelector() {
  const { model, setModel } = useChat();
  const currentModel = getModelById(model) || models[0];
  const [open, setOpen] = useState(false);
  
  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof models>);
  
  // Provider display names
  const providerNames = {
    'openai': 'LostMind AI Core',
    'google': 'LostMind AI Quantum Series',
  };
  
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg border border-neutral-200 dark:border-neutral-800"
          >
            {currentModel && (
              <>
                <div className="flex items-center gap-2">
                  {currentModel.logoPath && (
                    <Image 
                      src={currentModel.logoPath} 
                      alt={currentModel.name} 
                      width={18} 
                      height={18} 
                      className="rounded-sm"
                    />
                  )}
                  <span className="text-sm font-medium">{currentModel.name}</span>
                </div>
                <div className="flex gap-1">
                  {currentModel.capabilities.slice(0, 3).map((capability) => (
                    <ModelBadge key={capability} capability={capability} size="sm" />
                  ))}
                </div>
              </>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel className="text-center text-sm font-medium">
            Select AI Model
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={model} onValueChange={(value) => {
            setModel(value);
            setOpen(false);
          }}>
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <React.Fragment key={provider}>
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {providerNames[provider] || provider}
                </DropdownMenuLabel>
                {providerModels.map((model) => (
                  <ModelItem key={`${model.id}-${model.name}`} model={model} isSelected={currentModel.id === model.id && currentModel.name === model.name} />
                ))}
                <DropdownMenuSeparator />
              </React.Fragment>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ModelItem({ model, isSelected }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DropdownMenuRadioItem 
            value={model.id} 
            className={cn(
              "flex items-center gap-2 px-2 py-2 cursor-pointer",
              isSelected && "bg-accent"
            )}
          >
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border",
              isSelected && "bg-primary text-primary-foreground border-primary"
            )}>
              {model.logoPath ? (
                <Image 
                  src={model.logoPath} 
                  alt={model.name} 
                  width={24} 
                  height={24} 
                  className="rounded-sm"
                />
              ) : (
                <div className="h-4 w-4 bg-primary rounded-sm" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm">{model.name}</div>
              <div className="flex gap-1">
                {model.capabilities.map((capability) => (
                  <ModelBadge key={capability} capability={capability} size="sm" />
                ))}
              </div>
            </div>
            {isSelected && (
              <Check className="h-4 w-4 ml-auto text-primary" />
            )}
          </DropdownMenuRadioItem>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-[220px]">
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold">{model.name}</div>
            <div className="text-xs">{model.description}</div>
            {model.contextWindow && (
              <div className="text-xs text-muted-foreground">
                Context: {(model.contextWindow / 1000).toLocaleString()}k tokens
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### 3. Model Logo SVGs
Create branded SVG logos for each model in the `/public/logos/` directory:

- `/public/logos/lostmind-lite.svg` - LostMind Lite (simple design)
- `/public/logos/lostmind-pro.svg` - LostMind Pro (enhanced design)
- `/public/logos/lostmind-quantum.svg` - Quantum (complex neural network)
- `/public/logos/lostmind-vision.svg` - Vision Pro (eye-inspired design)
- `/public/logos/lostmind-flash.svg` - Flash (lightning/speed motif)

Each logo should follow the LostMind brand guidelines with blues and purples.

### 4. Model Selector CSS (if needed)
Create custom styles in `/styles/model-selector.css` if additional styling is needed beyond Tailwind:

```css
.model-badge-pulse {
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.model-gradient-hover {
  background-size: 200% 200%;
  background-position: 0% 0%;
  transition: background-position 0.5s ease-in-out;
}

.model-gradient-hover:hover {
  background-position: 100% 100%;
}
```

### 5. Chat Hook Integration
Update the chat hook in `/lib/hooks/use-chat.ts` to properly handle model changes:

```tsx
'use client';

import { useCallback, useState } from 'react';
import { getModelById, getDefaultModel } from '@/lib/models';
import { useLocalStorage } from './use-local-storage';

export function useChat() {
  // Store selected model ID in local storage
  const [modelId, setModelId] = useLocalStorage('lostmind-selected-model', getDefaultModel().id);
  
  // Set model with validation
  const setModel = useCallback((id: string) => {
    const model = getModelById(id);
    if (model) {
      setModelId(model.id);
    } else {
      // Fallback to default if model not found
      setModelId(getDefaultModel().id);
    }
  }, [setModelId]);
  
  return {
    model: modelId,
    setModel,
  };
}
```

## Expected Outcome
- Visually appealing model selector with LostMind branding
- Clear grouping of models by provider
- Intuitive capability badges for each model
- Helpful tooltips with detailed model information
- Smooth transitions between model selections
- Proper keyboard navigation and accessibility
- Responsive design for mobile and desktop
- Persistent model selection across sessions

## Verification Steps
1. Test model selector on desktop and mobile views
2. Verify that all 5 models appear with proper grouping
3. Check that capability badges display correctly with tooltips
4. Test keyboard navigation and accessibility features
5. Confirm that model selection persists across page refreshes
6. Verify tooltips show correct information for each model
7. Test that the chat system properly switches models when selected

## Related Documentation
- Shadcn UI Components: https://ui.shadcn.com/docs/components/dropdown-menu
- Next.js Image Component: https://nextjs.org/docs/api-reference/next/image
- Lucide React Icons: https://lucide.dev/icons/
- Web Accessibility Guidelines: https://www.w3.org/WAI/standards-guidelines/wcag/
- CSS Animations: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
