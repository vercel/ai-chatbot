# Hooks Directory

Custom React hooks for shared state management and side effects.

## Hooks

### `use-artifact.ts`
Manages artifact state (code, text, images, spreadsheets):
- Provides artifact context and state management
- Handles artifact creation, updates, and versioning
- Exports `useArtifact()` hook and artifact context

### `use-auto-resume.ts`
Handles automatic chat resumption:
- Detects when to auto-resume a chat conversation
- Manages resume state and triggers

### `use-chat-visibility.ts`
Manages chat visibility settings:
- Handles public/private chat visibility
- Syncs visibility state with the database

### `use-messages.tsx`
Message list management:
- Manages message state and updates
- Handles message streaming and optimistic updates

### `use-mobile.ts`
Mobile device detection:
- Detects if the current device is mobile
- Used for responsive UI behavior

### `use-scroll-to-bottom.tsx`
Auto-scroll functionality:
- Automatically scrolls to bottom of chat/message list
- Handles scroll behavior during message streaming

## Usage

All hooks follow React hook conventions:
- Start with `use` prefix
- Can be used in client components only
- Some hooks provide context (e.g., `useArtifact`)

## Notes

- Hooks are typically used in client components (`"use client"`)
- Context-based hooks (like `useArtifact`) require providers in the component tree
- Hooks should be pure and avoid side effects where possible
