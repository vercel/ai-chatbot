# LostMind AI - Migration Plan for Latest Template

## 📊 Current State Summary

Based on my analysis, your old project had:

### ✅ What Was Completed (Phase 1):
1. **Complete Rebranding** - All 4 Phase 1 tasks completed
2. **Logo Component** - Neural network animation with themes
3. **Chat Header** - Full LostMind AI branding
4. **Authentication Pages** - Gradient designs with LostMind branding
5. **Metadata/SEO** - Complete rebranding and PWA manifest

### ⏳ What Was Planned but Incomplete:
1. **Phase 2**: Model Integration (Gemini 2.5 Pro/Flash)
2. **Phase 3**: Advanced Features (Splash screen, theme system, etc.)
3. **Phase 4**: Advanced Architecture (Context management, Cloud services, RAG system)

### 🔑 Key Information Discovered:
- **Database**: Properly configured Neon PostgreSQL
- **API Keys**: Gemini API key ready
- **Design System**: Brand colors, neural network themes
- **Model Strategy**: 5 models (2 Gemini + 3 existing)
- **Advanced Features**: Detailed technical specs for MCP, artifact system, cloud services

## 📋 Migration Action Plan

### Phase 1: Project Setup (Week 1)

#### 1.1 Clone and Configure Latest Template
```bash
cd "/Users/sumitm1/Documents/myproject/Ongoing Projects/VERCEL/ai-chatbot/lostmind-ai-chatbot-vercel"
```

#### 1.2 Update Dependencies
```bash
# Update to latest versions
pnpm update ai@4.3.15
pnpm update @ai-sdk/google@1.2.17
pnpm update @ai-sdk/react@1.2.12

# Add missing dependencies
pnmp add @ai-sdk/google framer-motion
```

#### 1.3 Environment Setup
```env
# Database (transfer from old project)
POSTGRES_URL=postgres://neondb_owner:npg_hzxVDBH4y1mJ@ep-green-darkness-a7grm3pd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# API Keys
GEMINI_API_KEY=AIzaSyBEvAcYruaw8VTME1krWcu76sz6IEB5hAk
OPENAI_API_KEY=your_openai_key

# Branding
NEXT_PUBLIC_APP_URL=https://chat.lostmindai.com
NEXT_PUBLIC_BRAND_NAME="LostMind AI"
```

### Phase 2: Core Rebranding (Week 2)

#### 2.1 Brand Assets Transfer
Create these directories and copy from old project:
```
/public/
  - favicon.ico (update if needed)
  - og-image.png (create LostMind branded)
  - apple-touch-icon.png
  - manifest.json

/components/
  - lostmind-logo.tsx (copy and adapt)
  - ui/logo-showcase.tsx (if needed)
```

#### 2.2 Key Component Updates
1. **Logo Component**: Adapt neural network animation
2. **Chat Header**: Replace with LostMind branding
3. **Auth Pages**: Apply gradient backgrounds
4. **Metadata**: Update all SEO tags

### Phase 3: Model Integration (Week 3)

#### 3.1 Gemini Integration
Following latest template pattern:
```typescript
// lib/ai/providers.ts
export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4o-mini'),
    'chat-model-large': openai('gpt-4o'),
    'chat-model-reasoning': wrapLanguageModel({
      model: google('gemini-2.5-pro-preview-05-06'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
      settings: {
        temperature: 0.2,
        topP: 0.85,
        maxOutputTokens: 64000,
        systemInstruction: "You are LostMind Quantum..."
      }
    }),
    'gemini-2.5-pro': google('gemini-2.5-pro-preview-05-06'),
    'gemini-2.5-flash': google('gemini-2.5-flash-preview'),
  },
});
```

#### 3.2 Model Branding
```typescript
// lib/ai/models.ts
export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'LostMind Lite',
    description: 'Fast, efficient responses',
    provider: 'openai',
  },
  {
    id: 'chat-model-large',
    name: 'LostMind Pro', 
    description: 'Advanced AI for complex tasks',
    provider: 'openai',
  },
  {
    id: 'chat-model-reasoning',
    name: 'LostMind Quantum',
    description: 'Deep reasoning with Gemini 2.5 Pro',
    provider: 'google',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'LostMind Vision Pro',
    description: 'Multimodal AI with vision',
    provider: 'google',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'LostMind Flash',
    description: 'Ultra-fast responses',
    provider: 'google',
  },
];
```

### Phase 4: Advanced Features Implementation (Week 4-6)

#### 4.1 Leverage Latest Template Features
1. **Resumable Streams**: Use built-in Redis support
2. **User Entitlements**: Implement rate limiting
3. **Advanced Auth**: Add user types
4. **Geolocation**: Use request hints
5. **MCP Support**: Follow the template's pattern

#### 4.2 Implement LostMind Specific Features
1. **Custom Splash Screen**
2. **Neural Network Themes**
3. **Enhanced Animations**

### Phase 5: Database Migration (Week 7)

#### 5.1 Schema Assessment
Compare old schema with new template's schema and create migration plan

#### 5.2 Data Migration
```bash
# Export data from old database
pg_dump $OLD_DATABASE_URL > old_database.sql

# Create migration script
# Import relevant data to new database
psql $NEW_DATABASE_URL < migration_script.sql
```

## 🎯 Success Criteria

### Week 1-2: Foundation
- [ ] Latest template running locally
- [ ] All dependencies updated
- [ ] Environment configured
- [ ] Basic branding applied

### Week 3-4: Core Features
- [ ] All 5 models working
- [ ] Complete LostMind branding
- [ ] Authentication working
- [ ] Database connected

### Week 5-6: Advanced Features
- [ ] MCP support implemented
- [ ] Advanced streaming working
- [ ] User entitlements active
- [ ] All planned features implemented

### Week 7: Production Ready
- [ ] Database migrated
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Deployed to chat.lostmindai.com

## 📁 File Transfer Checklist

### From Old Project → New Project:
```
/components/
  ✓ lostmind-logo.tsx
  ✓ Custom theme files

/lib/ai/
  ✓ Model configurations
  ✓ Provider setups (adapt to new format)

/public/
  ✓ Brand assets (favicon, icons, manifest)

/docs/
  ✓ Technical guidelines
  ✓ Advanced feature specs

Environment Variables:
  ✓ GEMINI_API_KEY
  ✓ DATABASE_URL
  ✓ All branding variables
```

## 🔧 Technical Considerations

1. **Version Differences**: AI SDK 4.1 → 4.3 has breaking changes
2. **New Features**: Resumable streams, MCP support, user entitlements
3. **Architecture**: Latest template uses more modular approach
4. **Database**: May need schema updates for new features

## 🚨 Important Notes

1. **Don't copy old API routes directly** - adapt to new patterns
2. **Test all models thoroughly** - verify Gemini integration works
3. **Use progressive enhancement** - implement features incrementally
4. **Document changes** - maintain project memory for future reference

## 📞 Next Steps

1. **Review this plan** with your team/stakeholders
2. **Set up development environment** with latest template
3. **Begin Phase 1** immediately
4. **Track progress** in new task management system
5. **Maintain daily progress logs**

Would you like me to help you start implementing any specific phase of this migration plan?
