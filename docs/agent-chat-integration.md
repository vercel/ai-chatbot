# Agent-Chat Integration Implementation Plan

## Overview
This document outlines the implementation plan for connecting the existing agent system with the chat system, enabling users to start conversations with AI agents that have custom prompts and personalities.

## Current Architecture

### What We Have ✅
- **Agent System**: Complete CRUD operations, UI, and user customization
- **Chat System**: Full streaming chat with tools and message history
- **Database Schema**: Agent and UserAgent tables with prompt customization
- **UI Components**: Agent browsing, detail pages, and prompt editing

### What's Missing ❌
- Database link between chats and agents
- Agent context in chat system prompts
- Functional "Start Chat" button
- Agent-aware chat creation flow

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Add Agent Reference to Chat Table
```sql
-- Migration: Add agentId to chat table
ALTER TABLE "chat" ADD COLUMN "agentId" TEXT REFERENCES "agent"("id");
CREATE INDEX "chat_agentId_idx" ON "chat"("agentId");
```

#### 1.2 Update Schema Types
```typescript
// In lib/db/schema.ts
export const chat = pgTable('chat', {
  // ... existing fields
  agentId: text('agentId').references(() => agent.id),
});

export type Chat = typeof chat.$inferSelect & {
  agentId?: string;
};
```

### Phase 2: Backend Integration

#### 2.1 Enhance Chat Creation API
**File**: `app/(chat)/api/chat/route.ts`

```typescript
// Add agent parameter handling
const { messages, agentSlug } = await req.json();

// Fetch agent data if agentSlug provided
let agentContext = null;
if (agentSlug) {
  const agentData = await getAgentWithUserState({
    slug: agentSlug,
    userId: databaseUser.id,
  });
  agentContext = agentData;
}

// Save chat with agent reference
await saveChat({
  id: chatId,
  userId: databaseUser.id,
  title: title || 'New Chat',
  visibility: 'private',
  agentId: agentContext?.agent.id,
});
```

#### 2.2 Update System Prompt Function
**File**: `lib/ai/prompts.ts`

```typescript
export const systemPrompt = ({
  selectedChatModel,
  requestHints,
  agentContext,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  agentContext?: {
    basePrompt: string;
    customPrompt?: string;
    agentName: string;
  };
}) => {
  const baseSystemPrompt = `You are Claude, a helpful AI assistant...`;
  
  if (agentContext) {
    const agentPrompt = [
      `You are now acting as "${agentContext.agentName}".`,
      agentContext.basePrompt,
      agentContext.customPrompt && `Additional customization: ${agentContext.customPrompt}`,
    ].filter(Boolean).join('\n\n');
    
    return `${agentPrompt}\n\n${baseSystemPrompt}`;
  }
  
  return baseSystemPrompt;
};
```

#### 2.3 Update Database Queries
**File**: `lib/db/queries.ts`

```typescript
// Enhance saveChat to accept agentId
export async function saveChat({
  id,
  userId,
  title,
  visibility,
  agentId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  agentId?: string;
}) {
  return await db.insert(chat).values({
    id,
    createdAt: new Date(),
    userId,
    title,
    visibility,
    agentId,
  });
}

// New function to get chat with agent data
export async function getChatWithAgent(chatId: string, userId: string) {
  const result = await db
    .select({
      chat: chat,
      agent: agent,
      customPrompt: userAgent.customPrompt,
    })
    .from(chat)
    .leftJoin(agent, eq(chat.agentId, agent.id))
    .leftJoin(userAgent, and(
      eq(userAgent.agentId, agent.id),
      eq(userAgent.userId, userId)
    ))
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
    .limit(1);

  return result[0] || null;
}
```

### Phase 3: Frontend Integration

#### 3.1 Implement "Start Chat" Functionality
**File**: `app/(chat)/agents/components/agent-detail-header.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { generateUUID } from '@/lib/utils';

export function AgentDetailHeader({ agent }: AgentDetailHeaderProps) {
  const router = useRouter();
  
  const handleStartChat = async () => {
    const chatId = generateUUID();
    
    // Create new chat with agent
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        agentSlug: agent.slug,
        messages: [],
      }),
    });
    
    if (response.ok) {
      router.push(`/chat/${chatId}`);
    }
  };

  return (
    // ... existing JSX
    <Button onClick={handleStartChat}>
      Start Chat
    </Button>
  );
}
```

#### 3.2 Update Chat Interface
**File**: `components/chat.tsx`

```typescript
// Add agent context to chat interface
export function Chat({ id, initialMessages }: ChatProps) {
  const [agentContext, setAgentContext] = useState<AgentContext | null>(null);
  
  useEffect(() => {
    // Fetch agent context if this is an agent chat
    const fetchAgentContext = async () => {
      const response = await fetch(`/api/chat/${id}/agent`);
      if (response.ok) {
        const data = await response.json();
        setAgentContext(data);
      }
    };
    
    fetchAgentContext();
  }, [id]);

  return (
    <div>
      {agentContext && (
        <div className="agent-header">
          <BotIcon />
          <span>Chatting with {agentContext.agentName}</span>
        </div>
      )}
      {/* ... rest of chat interface */}
    </div>
  );
}
```

#### 3.3 Add Agent Context API Endpoint
**File**: `app/(chat)/api/chat/[id]/agent/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await withAuth({ ensureSignedIn: true });
  const chatData = await getChatWithAgent(params.id, session.user.id);
  
  if (chatData?.agent) {
    return Response.json({
      agentName: chatData.agent.name,
      agentDescription: chatData.agent.description,
      basePrompt: chatData.agent.basePrompt,
      customPrompt: chatData.customPrompt,
    });
  }
  
  return Response.json(null);
}
```

### Phase 4: URL-Based Agent Chat Creation

#### 4.1 Support Query Parameters
**URL Pattern**: `/chat/new?agent=[slug]`

```typescript
// In chat page component
export default function ChatPage({ searchParams }: { searchParams: { agent?: string } }) {
  const agentSlug = searchParams.agent;
  
  useEffect(() => {
    if (agentSlug) {
      // Pre-populate chat with agent context
      setAgentContext({ slug: agentSlug });
    }
  }, [agentSlug]);
}
```

#### 4.2 Alternative: Direct Agent Chat URLs  
**URL Pattern**: `/agents/[slug]/chat`

Create new route that immediately starts a chat with the agent.

## Testing Plan

### Unit Tests
- [ ] Agent context integration in system prompt
- [ ] Chat creation with agent reference
- [ ] Database queries for agent-chat relationships

### Integration Tests  
- [ ] End-to-end agent chat flow
- [ ] Agent prompt customization in chat
- [ ] Chat history with agent context

### User Acceptance Tests
- [ ] User can browse agents and start chat
- [ ] Agent personality is maintained in conversation
- [ ] Custom prompts are applied correctly
- [ ] Chat history shows agent information

## Migration Strategy

### Database Migration
```sql
-- 0011_agent_chat_integration.sql
BEGIN;

-- Add agentId column to chat table
ALTER TABLE "chat" ADD COLUMN "agentId" TEXT;

-- Add foreign key constraint
ALTER TABLE "chat" ADD CONSTRAINT "chat_agentId_fkey" 
  FOREIGN KEY ("agentId") REFERENCES "agent"("id");

-- Add index for performance
CREATE INDEX "chat_agentId_idx" ON "chat"("agentId");

COMMIT;
```

### Deployment Steps
1. **Database Migration**: Apply schema changes
2. **Backend Deploy**: Update API endpoints and queries
3. **Frontend Deploy**: Update UI components and routing
4. **Testing**: Verify agent-chat integration works end-to-end

## Future Enhancements

### Phase 5: Advanced Features
- **Agent Switching**: Allow changing agents mid-conversation
- **Agent Memory**: Persist agent-specific context across chats
- **Agent Analytics**: Track usage metrics per agent
- **Agent Sharing**: Share agent chats with other users

### Phase 6: Agent Marketplace
- **Agent Rating**: Allow users to rate agents
- **Agent Discovery**: Better search and categorization
- **Agent Templates**: Pre-built agent configurations
- **Agent Forking**: Create variations of existing agents

## Success Metrics
- [ ] Users can successfully start chats with agents
- [ ] Agent personalities are consistently maintained
- [ ] Chat creation time remains under 2 seconds
- [ ] No regression in existing chat functionality
- [ ] Agent custom prompts work as expected

## Timeline
- **Phase 1-2**: 2-3 days (Backend integration)
- **Phase 3**: 2-3 days (Frontend integration)  
- **Phase 4**: 1-2 days (URL patterns and testing)
- **Total**: ~1 week for full implementation

---

## Implementation Notes

### Key Design Decisions
1. **Agent reference in chat table**: Enables querying agent chats efficiently
2. **System prompt composition**: Agent prompts take precedence over base system prompt
3. **Stateless chat creation**: Each chat creation fetches fresh agent data
4. **Optional agent context**: Existing chats continue to work without agents

### Performance Considerations
- Index on `chat.agentId` for fast agent chat queries
- Cache agent data to avoid repeated database calls
- Lazy load agent context in chat interface

### Error Handling
- Graceful degradation if agent is deleted
- Fallback to regular chat if agent data unavailable
- Clear error messages for invalid agent references