# Artifacts Directory

Server and client code for different artifact types. Artifacts are AI-generated content that can be displayed and edited (code, text, images, spreadsheets).

## Structure

### `actions.ts`
Server actions for artifact operations (shared across all artifact types)

### `code/`
Code artifact implementation:
- **`client.tsx`** - Client-side code artifact component
- **`server.ts`** - Server-side code artifact processing

### `text/`
Text artifact implementation:
- **`client.tsx`** - Client-side text artifact component
- **`server.ts`** - Server-side text artifact processing

### `image/`
Image artifact implementation:
- **`client.tsx`** - Client-side image artifact component

### `sheet/`
Spreadsheet artifact implementation:
- **`client.tsx`** - Client-side spreadsheet artifact component
- **`server.ts`** - Server-side spreadsheet artifact processing

## Pattern

Each artifact type follows a pattern:
- **Client component** - React component for rendering/editing
- **Server logic** - Server-side processing, validation, or API calls

## Notes

- Artifacts are managed through the `useArtifact` hook
- Artifact state is stored in React context
- Server actions handle persistence and updates
- Each artifact type has its own editor component in `components/editor/`
