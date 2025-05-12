# Task 1.3: Migrate Authentication Pages

## Task Overview
Update authentication pages to incorporate LostMind branding and ensure they work with the latest template's authentication system.

## Priority: HIGH

## Objectives
1. Update login/register pages with LostMind branding
2. Add gradient styling and neural design elements
3. Integrate LostMind logo
4. Ensure compatibility with NextAuth v5 beta

## Current Template Location
```
/app/(auth)/login/page.tsx
/app/(auth)/register/page.tsx
/components/auth-form.tsx
```

## Required Changes

### 1. Add LostMind Branding to Auth Pages
```tsx
// Import LostMind logo
import { LostMindLogo } from '@/components/lostmind-logo';

// Add gradient background
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <LostMindLogo 
      width={80} 
      height={80} 
      showText={true} 
      theme="gradient" 
      animated={true}
    />
    <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      Welcome to LostMind AI
    </h1>
  </div>
</div>
```

### 2. Update Auth Form Component
```tsx
<div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border border-blue-100 dark:border-blue-900 shadow-xl rounded-2xl p-8 max-w-md w-full">
  {/* Form content */}
</div>
```

### 3. Add Neural Network Styling
```css
.auth-container {
  position: relative;
  overflow: hidden;
}

.auth-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.1), transparent);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
```

### 4. Update Welcome Messages
```tsx
<div className="text-center">
  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
    Join the LostMind AI Experience
  </h2>
  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
    Unlock the power of neural-enhanced AI conversation
  </p>
</div>
```

## Implementation Steps

1. **Update Auth Pages**
   - Add LostMind logo to login/register
   - Update background gradients
   - Add neural styling elements

2. **Enhance Auth Form**
   - Add backdrop blur effects
   - Update button styling with gradients
   - Improve form aesthetics

3. **Update Messaging**
   - Change welcome messages
   - Add LostMind-specific copy
   - Include branding elements

## Code Example

```tsx
'use client';

import { LostMindLogo } from '@/components/lostmind-logo';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 relative overflow-hidden">
      {/* Neural network background effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(79,70,229,0.3),transparent)]" />
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <LostMindLogo 
              width={80} 
              height={80} 
              showText={true} 
              theme="gradient" 
              animated={true}
            />
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to LostMind AI
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sign in to access your neural-powered AI assistant
            </p>
          </div>
          
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border border-blue-100 dark:border-blue-900 shadow-xl rounded-2xl p-8">
            <AuthForm action="signin" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Testing Requirements

### Visual Tests
- [ ] Logo displays properly on auth pages
- [ ] Gradient backgrounds render correctly
- [ ] Backdrop blur effects work on all browsers
- [ ] Dark/light theme compatibility

### Functional Tests
- [ ] Authentication flow works with NextAuth v5
- [ ] Form submissions complete successfully
- [ ] Error handling displays properly
- [ ] Redirect logic works correctly

## Success Criteria
- [ ] All auth pages show LostMind branding
- [ ] Neural network styling implemented
- [ ] Authentication functionality preserved
- [ ] Responsive design maintained
- [ ] Proper theme support

## Notes
- Maintain existing authentication logic
- Ensure accessibility standards are met
- Test with various screen sizes
- Verify dark mode compatibility

## Next Task
After completing this task, proceed to Task 1.4: Update Metadata and SEO

---
**Status**: PENDING  
**Estimated Time**: 45-60 minutes  
**Dependencies**: None
