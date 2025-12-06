# Data360 Widgets

This directory contains widget components for rendering outputs from Data360 MCP tools.

## Structure

- `types.ts` - Shared TypeScript types for Data360 tool outputs
- `get-wdi-data.tsx` - Widget for the `get_wdi_data` tool (World Development Indicators)
- `index.tsx` - Barrel export file for all widgets

## Adding a New Widget

To add a widget for a new Data360 tool:

1. Create a new file: `components/data360/your-tool-name.tsx`
2. Import shared types from `./types` if needed
3. Export your widget component
4. Add the export to `index.tsx`
5. Register the widget in `components/message.tsx` by checking for the tool type

Example:

```tsx
// components/data360/your-tool-name.tsx
"use client";

import type { YourToolOutput } from "./types";

export function YourToolWidget({ output }: { output: YourToolOutput }) {
  // Your widget implementation
}
```

Then in `components/message.tsx`:

```tsx
if ((type as string) === "tool-ai4data_ai4data_mcpyour_tool_name") {
  // Render YourToolWidget
}
```

