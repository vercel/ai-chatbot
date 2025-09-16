# Generate Object Schema Builder Guide

This guide documents how to recreate the schema-building experience from the `testground` project inside this repository. The goal is to let a user compose a `generateObject` call through a visual interface, capture the schema definition, and execute the request through our API.

## Conceptual Overview

1. **Schema definition lives in shared types.** Both UI components and API routes consume a `SchemaDefinition` object so the front-end and back-end always agree on the structure that the LLM must return.
2. **UI captures schema intent.** A dedicated schema builder lets users add fields, select primitive types, switch between array/object/enum outputs, and optionally describe each field.
3. **Server rebuilds Zod schema on demand.** When a generate block executes, the API route translates the stored `SchemaDefinition` into a real Zod object (or enum) and hands that shape to `generateObject`.
4. **Execution state flows through blocks.** Generate blocks store both configuration and results; the parse/execute logic handles substituting prior block outputs into subsequent prompts.

## Data Model

Create shared types under `app/types.ts` (or an equivalent module) so the builder, execution hook, and API all consume identical definitions:

```ts
export type SchemaPrimitive = 'string' | 'number' | 'boolean' | 'string[]';

export interface SchemaProperty {
  name: string;
  type: SchemaPrimitive;
  description?: string;
}

export type SchemaOutputKind = 'object' | 'array' | 'enum';

export interface SchemaDefinition {
  outputType: SchemaOutputKind;
  properties?: SchemaProperty[];
  enumValues?: string[];
}

export interface GenerateBlockSettings {
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  generateType: 'text' | 'object';
  schemaDefinition?: SchemaDefinition;
}
```

Recommended conventions:
- `properties` is required when `outputType` is `object` or `array`.
- `enumValues` is required when `outputType` is `enum`.
- Keep types minimal and serializable; they will be persisted in state and POSTed to the API.

## UI Schema Builder Component

Implement a client component (e.g. `components/SchemaBuilder.tsx`) patterned after the original `testground/components/schema-builder.tsx`:

1. **High-level mode selector** – Three buttons/tabs for `object`, `array`, and `enum`, each calling `onChange` with the new `outputType`.
2. **Enum editor** – When `outputType === 'enum'`, render a list of inputs for each string value plus an “Add Value” button.
3. **Property editor** – For `object`/`array` types:
   - Render existing properties in cards.
   - Provide inputs for `name`, a select for `type`, and an optional description input.
   - Include remove buttons and an “Add Field” CTA.
4. **State updates** – Never mutate the incoming `value`; instead clone existing arrays before updating. Always call `onChange` with a full `SchemaDefinition`.
5. **Empty state** – When no properties exist, show an inviting placeholder with a button to add the first field.

Useful improvements over the reference implementation:
- Validate that property names are unique before saving.
- Disable adding enum values while one is blank to avoid empty strings.
- Surface type descriptions (tooltips or helper text) to guide the user.

### Integration in Generate Block Settings

Inside the generate block configuration sheet (e.g. `components/BlockSettings.tsx`):

```tsx
{settings.generateType === 'object' && (
  <SchemaBuilder
    value={settings.schemaDefinition ?? { outputType: 'object', properties: [] }}
    onChange={(schema) => onUpdate({ schemaDefinition: schema })}
  />
)}
```

Show temperature/max token inputs alongside the builder; persist the schema on `onUpdate` so it travels with the block’s settings.

## Execution Flow

1. **Prompt parsing** – Before executing, parse the current block’s prompt template, substituting values from prior blocks (inputs or generated results). See `testground/app/page.tsx` + `useBlockExecution` for a working pattern.
2. **API request payload** – When `generateType === 'object'`, include `schemaDefinition` in the fetch body:
   ```ts
   await fetch('/api/generate', {
     method: 'POST',
     body: JSON.stringify({
       prompt,
       generateType: 'object',
       temperature,
       maxTokens,
       schemaDefinition,
     }),
   });
   ```
3. **Execution state** – Mark the block as `isExecuting` while awaiting the result and store the response (string, array, or object) on success.

## Server Route and Zod Schema Construction

Recreate the route under `app/api/generate/route.ts` with the following structure:

```ts
import { z } from 'zod';

const primitiveLookup = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
  'string[]': z.array(z.string()),
} as const;

function buildSchema(def: SchemaDefinition) {
  if (def.outputType === 'enum') {
    if (!def.enumValues?.length) {
      throw new Error('Enum values are required for enum output.');
    }
    return { output: 'enum' as const, enumValues: def.enumValues };
  }

  const shape = Object.fromEntries(
    (def.properties ?? []).map((prop) => {
      const base = primitiveLookup[prop.type] ?? z.string();
      return [prop.name, base.describe(prop.description ?? '')];
    }),
  );

  const schema = z.object(shape);

  if (def.outputType === 'array') {
    return { output: 'array' as const, schema };
  }

  return { output: 'object' as const, schema };
}
```

The route logic becomes:

1. Parse the JSON body into a `GenerateRequest` object.
2. Validate `prompt` and ensure a schema is present when `generateType === 'object'`.
3. Call `buildSchema(schemaDefinition)` to receive the correct `generateObject` parameters.
4. Choose the right `generateObject` call:
   - `output: 'enum'` + `enum: enumValues` for enums.
   - `output: 'array'` + `schema` for lists.
   - Default `schema` for single objects.
5. Handle errors. If the caught error is a `ZodError`, return a `400` with details; otherwise return `500`.

## Suggested Implementation Steps

1. **Create or update shared types** in `app/types.ts` and ensure they flow through block settings.
2. **Build the `SchemaBuilder` component** in `components/` (mark it `"use client"`). Hook it into block settings as described.
3. **Wire block execution** so the schema persists and is included in API calls. If a `useBlockExecution` hook already exists, mirror the reference implementation’s pattern.
4. **Implement the API route** under `app/api/generate/route.ts` (or adjust the existing one) to translate schema definitions into Zod and call `generateObject`.
5. **Surface results** in the UI using the existing `ResultView` pattern; ensure arrays and objects are displayed nicely (stringify with indentation or leverage JSON viewers).
6. **Add validation + UX polish**:
   - Disable execution when required schema pieces are missing.
   - Highlight invalid property names or duplicates.
   - Provide inline copy of the derived JSON schema/Zod snippet for transparency.
7. **Test manually and via Playwright**:
   - Scenario: single object with text/number fields.
   - Scenario: list output returning array of objects.
   - Scenario: enum selection returns valid value.
   - Scenario: Zod validation failure (e.g., intentionally mismatched result) surfaces in UI.

## Extension Ideas

- Support nested schemas by allowing a property type of `object` that opens another builder.
- Add advanced Zod modifiers (min/max, optional fields) once the base flow is stable.
- Persist block configurations to the database so users can reload saved flows.
- Provide a preview of the final `generateObject` call or copy-to-clipboard integration.

## References

- Source implementation: `/Users/ethanwoo/dev/testground/testground/components/schema-builder.tsx`
- API logic: `/Users/ethanwoo/dev/testground/testground/app/api/generate/route.ts`
- Block execution flow: `/Users/ethanwoo/dev/testground/testground/app/hooks/use-block-execution.ts`

Use these patterns as the blueprint for rebuilding the feature in this project.
