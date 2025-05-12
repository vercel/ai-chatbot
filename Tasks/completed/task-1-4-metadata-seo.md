# Task 1.4: Update Metadata and SEO

## Objective
Complete the final Phase 1 task by updating all metadata, SEO elements, and branding assets to transform the Vercel chatbot template into the LostMind AI branded experience.

## Priority
IMMEDIATE (critical for Phase 1 completion)

## Dependencies
- Task 1.1, 1.2, and 1.3 completed
- LostMind logo component available
- Brand colors established

## Files to Update

### 1. Root Layout Metadata (`/app/layout.tsx`)
Update the root layout with comprehensive LostMind AI metadata:

```typescript
export const metadata: Metadata = {
  title: 'LostMind AI | Neural-Powered AI Chat',
  description: 'Experience the future of AI conversation with LostMind AI - featuring 5 advanced language models including Gemini 2.5 Pro and GPT-4',
  keywords: ['AI', 'chatbot', 'Gemini', 'GPT-4', 'LostMind', 'neural network', 'conversation'],
  openGraph: {
    title: 'LostMind AI',
    description: 'Neural-powered AI assistant with 5 advanced models',
    url: 'https://chat.lostmindai.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LostMind AI - Neural Network Chat',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  authors: [{ name: 'LostMind AI Team' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  themeColor: '#4F46E5',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}
```

### 2. Home Page Metadata (`/app/page.tsx`)
Add specific home page metadata:

```typescript
export const metadata: Metadata = {
  title: 'Home | LostMind AI',
  description: 'Connect with the most advanced AI models in one neural-powered interface. LostMind AI brings you GPT-4, Gemini 2.5 Pro, and more.',
  openGraph: {
    title: 'LostMind AI - Home',
    description: 'Your gateway to AI-powered conversation',
    images: ['/og-home.png'],
  },
}
```

### 3. Create PWA Manifest (`/app/manifest.json`)
```json
{
  "name": "LostMind AI",
  "short_name": "LostMind AI",
  "description": "Neural-powered AI chat with 5 advanced models",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 4. Update Sitemap (`/app/sitemap.ts`)
```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://chat.lostmindai.com',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://chat.lostmindai.com/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://chat.lostmindai.com/register',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://chat.lostmindai.com/chat',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]
}
```

### 5. Create/Update Favicon Files
Files needed in `/public/`:
- `favicon.ico`
- `apple-icon.png`
- `og-image.png` (1200x630)
- `og-home.png` (1200x630)
- `icon-192x192.png`
- `icon-512x512.png`

## Brand Guidelines
- Use LostMind neural theme consistently
- Primary gradient: Blue (#4F46E5) to Purple (#8B5CF6)
- Include "Neural-powered" in descriptions
- Emphasize "5 advanced AI models" feature

## Implementation Steps
1. Update `/app/layout.tsx` metadata
2. Update `/app/page.tsx` metadata
3. Create `/app/manifest.json`
4. Update/create `/app/sitemap.ts`
5. Create OpenGraph and favicon images
6. Test metadata with social preview tools
7. Verify PWA functionality

## Validation Checklist
- [ ] Metadata correctly sets title, description, keywords
- [ ] OpenGraph tags display properly on social media
- [ ] Favicon displays correctly in browser
- [ ] PWA manifest valid
- [ ] Sitemap accessible at /sitemap.xml
- [ ] All brand elements consistent
- [ ] No Vercel references remain

## Success Criteria
- All metadata reflects LostMind AI branding
- Social sharing shows correct preview
- PWA functionality working
- SEO optimized for target keywords
- No broken links or missing images

## Notes
- Use AI SDK patterns for any dynamic metadata
- Ensure responsive og:images
- Test on multiple platforms (Twitter, LinkedIn, etc.)
- Document any new assets created

## Time Estimate
2-3 hours

## Files Created/Modified
- `/app/layout.tsx`
- `/app/page.tsx`
- `/app/manifest.json`
- `/app/sitemap.ts`
- Various image files in `/public/`

---
Task created: May 12, 2025
Status: PENDING
