import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { SchemaDefinition } from '@/app/structured/types';

const propertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'string[]']),
  description: z.string().optional(),
});

const requestSchema = z.object({
  prompt: z.string().min(1),
  schemaDefinition: z.object({
    outputType: z.enum(['object', 'array']),
    properties: z.array(propertySchema).min(1),
  }),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4000).optional(),
});

const primitiveLookup = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
  'string[]': z.array(z.string()),
} as const;

type PrimitiveKey = keyof typeof primitiveLookup;

function buildZodSchema(definition: SchemaDefinition) {
  const shape = Object.fromEntries(
    definition.properties.map((property) => {
      const base = primitiveLookup[property.type as PrimitiveKey] ?? z.string();
      const described = property.description
        ? base.describe(property.description)
        : base;
      return [property.name, described];
    }),
  );

  return z.object(shape);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      schemaDefinition,
      temperature = 0.2,
      maxTokens = 400,
    } = requestSchema.parse(body);

    const schema = buildZodSchema(schemaDefinition);
    const model = openai('gpt-4o-mini');

    const response = await generateObject({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      maxTokens,
      ...(schemaDefinition.outputType === 'array'
        ? { output: 'array' as const, schema }
        : { schema }),
    });

    return new Response(JSON.stringify({ result: response.object }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request payload',
          details: error.errors,
        }),
        { status: 400 },
      );
    }

    console.error('Structured generation failed', error);

    return new Response(
      JSON.stringify({ error: 'Failed to generate structured response' }),
      { status: 500 },
    );
  }
}
