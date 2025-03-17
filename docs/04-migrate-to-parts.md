# Migrate to Message Parts

The release of [`@ai-sdk/react@1.1.10`](https://github.com/vercel/ai/pull/4670) introduced a new property called `parts` to messages in the `useChat` hook. We recommend rendering the messages using the `parts` property instead of the `content` property. The parts property supports different message types, including text, tool invocation, and tool result, and allows for more flexible and complex chat and agent-like user interfaces.

You can read the API reference for the `parts` property [here](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat#messages.ui-message.parts).

## Migrating your existing project to use the `parts` property

Your existing project must already have messages stored in the database. To migrate your messages to use `parts`, you will have to create new tables for `Message` and `Vote`, backfill the new tables with transformed messages, and delete (optional) the old tables.

These are the following steps:
1. Create tables `Message_v2` and `Vote_v2` with updated schemas at `/lib/db/schema.ts`
2. Update the `Message` component at `/components/message.tsx` to use parts and render content.
3. Run migration script at `src/lib/db/helpers/01-migrate-to-parts.ts`

### 1. Creating Tables with Updated Schemas

You will mark the earlier tables as deprecated and create two new tables, `Message_v2` and `Vote_v2`. Table `Message_v2` contains the updated schema that includes the `parts` property. Table `Vote_v2` does not contain schema changes but will contain votes that point to the transformed messages in `Message_v2`.

Before creating the new tables, you will need to update the variables of existing tables to indicate that they are deprecated.

```tsx title="/lib/db/schema.ts"
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;
```

After deprecating the current table schemas, you can now proceed to create schemas for the new tables.

```ts title="/lib/db/schema.ts"
export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;
```

### 2. Updating the Message Component

Previously you were using content types to render messages and tool invocations. Now you will use the `parts` property to render messages and tool invocations.

```tsx title="components/message.tsx"
{message.parts?.map((part, index) => {
  const { type } = part;
  const key = `message-${message.id}-part-${index}`;

  if (type === "reasoning") {
    return (
      <MessageReasoning
        key={key}
        isLoading={isLoading}
        reasoning={part.reasoning}
      />
    );
  }

  if (type === "text") {
    if (mode === "view") {
      return (
        <div key={key} className="flex flex-row gap-2 items-start">
          {message.role === "user" && !isReadonly && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-edit-button"
                  variant="ghost"
                  className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                  onClick={() => {
                    setMode("edit");
                  }}
                >
                  <PencilEditIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit message</TooltipContent>
            </Tooltip>
          )}

          <div
            data-testid="message-content"
            className={cn("flex flex-col gap-4", {
              "bg-primary text-primary-foreground px-3 py-2 rounded-xl":
                message.role === "user",
            })}
          >
            <Markdown>{part.text}</Markdown>
          </div>
        </div>
      );
    }

    if (mode === "edit") {
      return (
        <div key={key} className="flex flex-row gap-2 items-start">
          <div className="size-8" />

          <MessageEditor
            key={message.id}
            message={message}
            setMode={setMode}
            setMessages={setMessages}
            reload={reload}
          />
        </div>
      );
    }
  }

  if (type === "tool-invocation") {
    const { toolInvocation } = part;
    const { toolName, toolCallId, state } = toolInvocation;

    if (state === "call") {
      const { args } = toolInvocation;

      return (
        <div
          key={toolCallId}
          className={cx({
            skeleton: ["getWeather"].includes(toolName),
          })}
        >
          {toolName === "getWeather" ? (
            <Weather />
          ) : toolName === "createDocument" ? (
            <DocumentPreview isReadonly={isReadonly} args={args} />
          ) : toolName === "updateDocument" ? (
            <DocumentToolCall
              type="update"
              args={args}
              isReadonly={isReadonly}
            />
          ) : toolName === "requestSuggestions" ? (
            <DocumentToolCall
              type="request-suggestions"
              args={args}
              isReadonly={isReadonly}
            />
          ) : null}
        </div>
      );
    }

    if (state === "result") {
      const { result } = toolInvocation;

      return (
        <div key={toolCallId}>
          {toolName === "getWeather" ? (
            <Weather weatherAtLocation={result} />
          ) : toolName === "createDocument" ? (
            <DocumentPreview
              isReadonly={isReadonly}
              result={result}
            />
          ) : toolName === "updateDocument" ? (
            <DocumentToolResult
              type="update"
              result={result}
              isReadonly={isReadonly}
            />
          ) : toolName === "requestSuggestions" ? (
            <DocumentToolResult
              type="request-suggestions"
              result={result}
              isReadonly={isReadonly}
            />
          ) : (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      );
    }
  }
})}
```

### 3. Running the Migration Script

At this point, you can deploy your application so new messages can be stored in the new format.

To restore messages of previous chat conversations, you can run the following script that applies a transformation to the old messages and stores them in the new format.

```zsh title="shell"
pnpm exec tsx lib/db/helpers/01-core-to-parts.ts
```

This script will take some time to complete based on the number of messages to be migrated. After completion, you can verify that the messages have been successfully migrated by checking the database.
