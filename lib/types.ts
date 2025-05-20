import { z } from 'zod';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export const dataPartSchemas = {
  'artifacts-text-delta': z.string(),
  'artifacts-code-delta': z.string(),
  'artifacts-sheet-delta': z.string(),
  'artifacts-image-delta': z.string(),
  'artifacts-title': z.string(),
  'artifacts-id': z.string(),
  'artifacts-suggestion': z.any(),
  'artifacts-clear': z.string(),
  'artifacts-finish': z.string(),
  'artifacts-kind': z.string(),

  'append-in-flight-message': z.string(),
};

// type SchemaMap = typeof dataPartSchemas;
// export type DataStreamDelta = {
//   [K in keyof SchemaMap]: {
//     type: K;
//     data: z.infer<SchemaMap[K]>;
//   };
// }[keyof SchemaMap];

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
