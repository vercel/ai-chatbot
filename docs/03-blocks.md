# Blocks

Blocks is a special user interface mode that allows you to have a workspace like interface along with the chat interface. This is similar to [ChatGPT's Canvas](https://openai.com/index/introducing-canvas) and [Claude's Artifacts](https://www.anthropic.com/news/artifacts).

The template already ships with the following blocks:

- **Text Block**: A block that allows you to work with text content like drafting essays and emails.
- **Code Block**: A block that allows you to write and execute code (Python).
- **Image Block**: A block that allows you to work with images like editing, annotating, and processing images.
- **Sheet Block**: A block that allows you to work with tabular data like creating, editing, and analyzing data.

## Adding a Custom Block

To add a custom block, you will need to create a folder in the `blocks` directory with the block name. The folder should contain the following files:

- `client.tsx`: The client-side code for the block.
- `server.ts`: The server-side code for the block.

Here is an example of a custom block called `CustomBlock`:

```bash
blocks/
  custom/
    client.tsx
    server.ts
```

### Client-Side Example (client.tsx)

This file is responsible for rendering your custom block. You might replace the inner UI with your own components, but the overall pattern (initialization, handling streamed data, and rendering content) remains the same. For instance:

```tsx
import { Block } from "@/components/create-block";
import { ExampleComponent } from "@/components/example-component";
import { toast } from "sonner";

interface CustomBlockMetadata {
  // Define metadata your custom block might need—the example below is minimal.
  info: string;
}

export const customBlock = new Block<"custom", CustomBlockMetadata>({
  kind: "custom",
  description: "A custom block for demonstrating custom functionality.",
  // Initialization can fetch any extra data or perform side effects
  initialize: async ({ documentId, setMetadata }) => {
    // For example, initialize the block with default metadata.
    setMetadata({
      info: `Document ${documentId} initialized.`,
    });
  },
  // Handle streamed parts from the server (if your block supports streaming updates)
  onStreamPart: ({ streamPart, setMetadata, setBlock }) => {
    if (streamPart.type === "info-update") {
      setMetadata((metadata) => ({
        ...metadata,
        info: streamPart.content as string,
      }));
    }
    if (streamPart.type === "content-update") {
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: draftBlock.content + (streamPart.content as string),
        status: "streaming",
      }));
    }
  },
  // Defines how the block content is rendered
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <div>Loading custom block...</div>;
    }

    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      return (
        <div>
          <h3>Diff View</h3>
          <pre>{oldContent}</pre>
          <pre>{newContent}</pre>
        </div>
      );
    }

    return (
      <div className="custom-block">
        <ExampleComponent
          content={content}
          metadata={metadata}
          onSaveContent={onSaveContent}
          isCurrentVersion={isCurrentVersion}
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            toast.success("Content copied to clipboard!");
          }}
        >
          Copy
        </button>
      </div>
    );
  },
  // An optional set of actions exposed in the block toolbar.
  actions: [
    {
      icon: <span>⟳</span>,
      description: "Refresh block info",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Please refresh the info for my custom block.",
        });
      },
    },
  ],
  // Additional toolbar actions for more control
  toolbar: [
    {
      icon: <span>✎</span>,
      description: "Edit custom block",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Edit the custom block content.",
        });
      },
    },
  ],
});
```

Server-Side Example (server.ts)

The server file processes the document for the block. It streams updates (if applicable) and returns the final content. For example:

```ts
import { smoothStream, streamText } from "ai";
import { myProvider } from "@/lib/ai/models";
import { createDocumentHandler } from "@/lib/blocks/server";
import { updateDocumentPrompt } from "@/lib/ai/prompts";

export const customDocumentHandler = createDocumentHandler<"custom">({
  kind: "custom",
  // Called when the document is first created.
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";
    // For demonstration, use streamText to generate content.
    const { fullStream } = streamText({
      model: myProvider.languageModel("block-model"),
      system:
        "Generate a creative piece based on the title. Markdown is supported.",
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: title,
    });

    // Stream the content back to the client.
    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        draftContent += delta.textDelta;
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta,
        });
      }
    }

    return draftContent;
  },
  // Called when updating the document based on user modifications.
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";
    const { fullStream } = streamText({
      model: myProvider.languageModel("block-model"),
      system: updateDocumentPrompt(document.content, "custom"),
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: "content",
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      if (delta.type === "text-delta") {
        draftContent += delta.textDelta;
        dataStream.writeData({
          type: "content-update",
          content: delta.textDelta,
        });
      }
    }

    return draftContent;
  },
});
```

Once you have created the client and server files, you can import the block in the `lib/blocks/server.ts` file and add it to the `documentHandlersByBlockKind` array.

```ts
export const documentHandlersByBlockKind: Array<DocumentHandler> = [
  ...,
  customDocumentHandler,
];

export const blockKinds = [..., "custom"] as const;
```

And also add the client-side block to the `blockDefinitions` array in the `components/block.tsx` file.

```ts
import { customBlock } from "@/blocks/custom/client";

export const blockDefinitions = [..., customBlock];
```

You should now be able to see the custom block in the workspace!
