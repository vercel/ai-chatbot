export type SchemaPrimitive = 'string' | 'number' | 'boolean' | 'string[]';

export interface SchemaProperty {
  name: string;
  type: SchemaPrimitive;
  description?: string;
}

export type SchemaOutputKind = 'object' | 'array';

export interface SchemaDefinition {
  outputType: SchemaOutputKind;
  properties: SchemaProperty[];
}

export interface StructuredGenerateRequest {
  prompt: string;
  schemaDefinition: SchemaDefinition;
  temperature?: number;
  maxTokens?: number;
}
