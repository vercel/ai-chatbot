# Task 1.2: Update Chat Header for Latest Template

## Task Overview
Update the chat header component to include LostMind branding and adapt it for the latest template's architecture with resumable streams and advanced features.

## Priority: HIGH

## Objectives
1. Replace Vercel branding with LostMind logo
2. Update header actions to match new template patterns
3. Adapt for resumable streams functionality
4. Enhance with LostMind-specific styling

## Current Template Location
```
/components/chat-header.tsx
```

## Required Changes

### 1. Logo Integration
```tsx
import { LostMindLogo } from '@/components/lostmind-logo';

// Replace existing logo
<LostMindLogo 
  width={40} 
  height={40} 
  showText={true} 
  theme={theme} 
  onClick={() => window.open('https://lostmindai.com', '_blank')}
/>
```

### 2. Update Navigation Button
```tsx
<Button
  variant="outline"
  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
  onClick={() => window.open('https://lostmindai.com', '_blank')}
>
  <span className="hidden md:block">Explore LostMind AI</span>
  <span className="md:hidden">Explore</span>
</Button>
```

### 3. Update Header Title Display
```tsx
// Update chat title or model display
<div className="flex items-center gap-2">
  {isGenerating && (
    <span className="text-sm text-blue-600 font-medium">
      ✨ LostMind is thinking...
    </span>
  )}
</div>
```

### 4. Style Updates
```css
/* Add gradient accent for header */
.chat-header {
  background: linear-gradient(to right, rgba(79, 70, 229, 0.05), rgba(139, 92, 246, 0.05));
  border-bottom: 1px solid rgba(79, 70, 229, 0.1);
}
```

## Implementation Steps

1. **Analyze Current Header**
   - Review existing chat-header.tsx structure
   - Identify components to replace/update

2. **Update Imports**
   ```tsx
   import { LostMindLogo } from '@/components/lostmind-logo';
   import { Button } from '@/components/ui/button';
   ```

3. **Replace Branding Elements**
   - Remove Vercel icon/logo
   - Add LostMind logo
   - Update navigation buttons

4. **Enhance with Theme Support**
   - Ensure gradient works with dark/light themes
   - Add theme-aware colors

5. **Test Functionality**
   - Verify logo click navigation
   - Test button interactions
   - Confirm responsive behavior

## Code Example

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LostMindLogo } from '@/components/lostmind-logo';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { ChatShareButton } from '@/components/chat-share-button';

interface ChatHeaderProps {
  selectedModelId: string;
  selectedVisibilityType: string;
  isReadonly: boolean;
  // ... other props
}

export function ChatHeader({
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  // ... other props
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarToggle />
          <Link href="/" className="flex items-center">
            <LostMindLogo 
              width={40} 
              height={40} 
              showText={true}
              theme="gradient"
              onClick={() => router.push('/')}
            />
          </Link>
        </div>
        
        <div className="flex-1 px-4">
          <ModelSelector
            selectedModelId={selectedModelId}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            onClick={() => window.open('https://lostmindai.com', '_blank')}
          >
            <span className="hidden md:block">Explore LostMind AI</span>
            <span className="md:hidden">Explore</span>
          </Button>
          
          {!isReadonly && (
            <ChatShareButton
              chatId={chat.id}
              visibility={selectedVisibilityType}
            />
          )}
        </div>
      </div>
    </header>
  );
}
```

## Testing Requirements

### Visual Tests
- [ ] Logo displays properly in header
- [ ] Gradient button renders correctly
- [ ] Responsive layout works on all screen sizes
- [ ] Dark/light theme variants display properly

### Functional Tests
- [ ] Logo click navigation works
- [ ] Explore button opens correct URL
- [ ] Model selector integration remains functional
- [ ] Share button functionality preserved

## Compatibility Checks

### Latest Template Features
- [ ] Works with resumable streams
- [ ] Compatible with user entitlements
- [ ] Supports new message parts API
- [ ] Integrates with MCP features

## Success Criteria
- [ ] All Vercel branding removed
- [ ] LostMind logo properly integrated
- [ ] Gradient styling implemented
- [ ] Responsive design maintained
- [ ] Navigation functions correctly
- [ ] Ready for model integration phase

## Notes
- Maintain existing accessibility features
- Ensure header works with all planned models
- Keep performance optimized
- Document any significant changes

## Next Task
After completing this task, proceed to Task 1.3: Migrate Authentication Pages

---
**Status**: PENDING  
**Estimated Time**: 45-60 minutes  
**Dependencies**: Task 1.1 (Logo Component)
