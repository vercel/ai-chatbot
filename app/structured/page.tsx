'use client';

import { useMemo, useState } from 'react';
import { StructuredSchemaBuilder } from '@/components/structured/StructuredSchemaBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SchemaDefinition } from './types';

type StructuredResult = unknown;

const DEFAULT_SCHEMA: SchemaDefinition = {
  outputType: 'object',
  properties: [
    {
      name: 'title',
      type: 'string',
      description: 'Short summary for the result',
    },
    {
      name: 'key_points',
      type: 'string[]',
      description: 'List of bullets to highlight',
    },
  ],
};

export default function StructuredPage() {
  const [schemaDefinition, setSchemaDefinition] =
    useState<SchemaDefinition>(DEFAULT_SCHEMA);
  const [prompt, setPrompt] = useState(
    'Summarize the latest Servant AI launch update with three bullet points.',
  );
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(400);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StructuredResult | null>(null);

  const cleanedSchema = useMemo(() => {
    const properties = schemaDefinition.properties
      .map((property) => ({
        ...property,
        name: property.name.trim(),
        description: property.description?.trim() || undefined,
      }))
      .filter((property) => property.name.length > 0);

    return { ...schemaDefinition, properties } satisfies SchemaDefinition;
  }, [schemaDefinition]);

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError('Add a prompt before generating.');
      return;
    }

    if (cleanedSchema.properties.length === 0) {
      setError('Add at least one field to your schema.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          schemaDefinition: cleanedSchema,
          temperature,
          maxTokens,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error ?? 'Structured generation failed';
        setError(message);
        return;
      }

      const payload = await response.json();
      setResult(payload.result ?? null);
    } catch (requestError) {
      console.error('Structured request failed', requestError);
      setError('Unable to reach the structured API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleGenerate();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Structured Object Playground</h1>
        <p className="text-sm text-muted-foreground">
          Define a schema, send a prompt, and inspect the exact object returned
          by <code>generateObject</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Output kind</Label>
              <Select
                value={schemaDefinition.outputType}
                onValueChange={(nextValue) =>
                  setSchemaDefinition((previous) => ({
                    ...previous,
                    outputType: nextValue as SchemaDefinition['outputType'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select output kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="object">Single object</SelectItem>
                  <SelectItem value="array">Array of objects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <StructuredSchemaBuilder
              value={schemaDefinition}
              onChange={setSchemaDefinition}
            />
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-0">
            <CardHeader>
              <CardTitle>Prompt &amp; output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="structured-prompt">Prompt</Label>
                <Textarea
                  id="structured-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={8}
                  placeholder="What should the model respond to?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="structured-temperature">Temperature</Label>
                  <Input
                    id="structured-temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(event) =>
                      setTemperature(Number(event.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="structured-max-tokens">Max tokens</Label>
                  <Input
                    id="structured-max-tokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={maxTokens}
                    onChange={(event) =>
                      setMaxTokens(Number(event.target.value) || 1)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? 'Generating…' : 'Generate structured output'}
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              {result && (
                <div className="rounded-md border bg-muted/40 p-4">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Output
                  </Label>
                  <pre className="mt-2 max-h-80 overflow-auto rounded bg-background p-3 text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
