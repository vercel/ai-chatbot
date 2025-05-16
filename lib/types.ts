import { z } from 'zod';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
