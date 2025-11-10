# Components Directory

React components organized by feature and purpose. The `/ui` folder is reserved for shadcn/ui component imports.

## Folder Structure

### `artifact/`
Components for displaying and managing AI-generated artifacts (code, text, images, spreadsheets):
- **`artifact.tsx`** - Main artifact container and renderer
- **`artifact-actions.tsx`** - Action buttons (save, version navigation)
- **`artifact-close-button.tsx`** - Close artifact button
- **`artifact-messages.tsx`** - Messages displayed within artifacts
- **`create-artifact.tsx`** - Artifact creation logic and toolbar

### `auth/`
Authentication UI components:
- **`auth-form.tsx`** - Login/registration form
- **`sign-out-form.tsx`** - Sign out button/form

### `chat/`
Chat interface components:
- **`chat.tsx`** - Main chat container component
- **`chat-header.tsx`** - Chat header with visibility controls
- **`messages.tsx`** - Messages list container
- **`message.tsx`** - Individual message component
- **`message-actions.tsx`** - Message action buttons (copy, vote)
- **`message-editor.tsx`** - Message editing interface
- **`message-reasoning.tsx`** - AI reasoning display for messages

### `document/`
Document preview and management:
- **`document.tsx`** - Document container and tool call/result handlers
- **`document-preview.tsx`** - Inline document preview component
- **`document-skeleton.tsx`** - Loading skeleton for documents

### `editor/`
Rich text and code editors:
- **`text-editor.tsx`** - ProseMirror-based text editor
- **`code-editor.tsx`** - Code editor with syntax highlighting
- **`sheet-editor.tsx`** - Spreadsheet editor
- **`image-editor.tsx`** - Image display and editing

### `elements/`
Message element components (rendered within chat messages):
- **`actions.tsx`** - Action buttons element
- **`code-block.tsx`** - Code block display
- **`conversation.tsx`** - Conversation thread element
- **`image.tsx`** - Image element
- **`message.tsx`** - Nested message element
- **`reasoning.tsx`** - Reasoning display element
- **`response.tsx`** - Response element
- **`tool.tsx`** - Tool call/result element
- And more...

### `input/`
Input components:
- **`multimodal-input.tsx`** - Main chat input with file attachments
- **`preview-attachment.tsx`** - File attachment preview

### `navigation/`
Navigation menu components:
- **`nav-main.tsx`** - Main navigation menu
- **`nav-projects.tsx`** - Projects navigation
- **`nav-secondary.tsx`** - Secondary navigation
- **`nav-user.tsx`** - User navigation menu

### `shared/`
Shared/common components used across the app:
- **`data-stream-provider.tsx`** - Context provider for data streaming
- **`data-stream-handler.tsx`** - Handler for streaming data
- **`theme-provider.tsx`** - Theme context provider (dark/light mode)
- **`icons.tsx`** - Icon component library
- **`toolbar.tsx`** - Toolbar component for artifacts
- **`console.tsx`** - Console output display
- **`diffview.tsx`** - Diff viewer component
- **`greeting.tsx`** - Welcome greeting component
- **`model-selector.tsx`** - AI model selector
- **`visibility-selector.tsx`** - Chat visibility selector
- **`submit-button.tsx`** - Form submit button with loading state
- **`suggested-actions.tsx`** - Suggested action buttons
- **`suggestion.tsx`** - Suggestion display component
- **`version-footer.tsx`** - Document version footer
- **`toast.tsx`** - Toast notification component
- **`weather.tsx`** - Weather display component

### `sidebar/`
Sidebar navigation components:
- **`app-sidebar.tsx`** - Main application sidebar
- **`inset-sidebar.tsx`** - Inset sidebar variant
- **`floating-sidebar.tsx`** - Floating sidebar variant
- **`sidebar-history.tsx`** - Chat history list in sidebar
- **`sidebar-history-item.tsx`** - Individual chat history item
- **`sidebar-toggle.tsx`** - Sidebar toggle button
- **`sidebar-user-nav.tsx`** - User navigation in sidebar

### `ui/`
**Reserved for shadcn/ui components** - Do not add custom components here. These are auto-generated from shadcn/ui CLI.

### `custom/`
Custom components that don't fit other categories:
- **`topnav.tsx`** - Top navigation component

## Import Conventions

- Use absolute imports: `@/components/...`
- Import from `@/components/ui/...` for shadcn components
- Import from feature folders: `@/components/chat/...`, `@/components/artifact/...`, etc.
