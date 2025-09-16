'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  SchemaDefinition,
  SchemaProperty,
} from '@/app/structured/types';

interface SchemaBuilderProps {
  value: SchemaDefinition;
  onChange: (schema: SchemaDefinition) => void;
}

const PROPERTY_TYPES: SchemaProperty['type'][] = [
  'string',
  'number',
  'boolean',
  'string[]',
];

const PROPERTY_LABELS: Record<SchemaProperty['type'], string> = {
  string: 'Text',
  number: 'Number',
  boolean: 'Yes / No',
  'string[]': 'List of text',
};

export function StructuredSchemaBuilder({
  value,
  onChange,
}: SchemaBuilderProps) {
  const properties = value.properties ?? [];

  const addProperty = () => {
    onChange({
      ...value,
      properties: [...properties, { name: '', type: 'string' }],
    });
  };

  const updateProperty = (
    index: number,
    updates: Partial<SchemaProperty>,
  ) => {
    const next = [...properties];
    next[index] = { ...next[index], ...updates };
    onChange({ ...value, properties: next });
  };

  const removeProperty = (index: number) => {
    const next = [...properties];
    next.splice(index, 1);
    onChange({ ...value, properties: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Schema fields</h2>
          <p className="text-sm text-muted-foreground">
            Add the keys you expect in the structured response.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addProperty}>
          Add field
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No fields yet. Add one to begin shaping the response.
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property, index) => (
            <div
              key={index}
              className="rounded-md border p-3 shadow-sm"
            >
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[180px] flex-1 space-y-2">
                  <Label htmlFor={`field-name-${index}`}>Field name</Label>
                  <Input
                    id={`field-name-${index}`}
                    value={property.name}
                    onChange={(event) =>
                      updateProperty(index, { name: event.target.value })
                    }
                    placeholder="e.g. headline"
                  />
                </div>
                <div className="w-full min-w-[140px] sm:w-[160px] space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={property.type}
                    onValueChange={(nextType) =>
                      updateProperty(index, {
                        type: nextType as SchemaProperty['type'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {PROPERTY_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto sm:self-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProperty(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Label htmlFor={`field-desc-${index}`}>
                  Description{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id={`field-desc-${index}`}
                  value={property.description ?? ''}
                  onChange={(event) =>
                    updateProperty(index, { description: event.target.value })
                  }
                  placeholder="Short hint for the model"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
