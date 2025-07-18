import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { createDocument } from './ai/tools/create-document';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { searchTranscriptsByKeyword } from './ai/tools/search-transcripts-by-keyword';
import type { searchTranscriptsByUser } from './ai/tools/search-transcripts-by-user';
import type { getTranscriptDetails } from './ai/tools/get-transcript-details';
import type { listAccessibleSlackChannels } from './ai/tools/list-accessible-slack-channels';
import type { fetchSlackChannelHistory } from './ai/tools/fetch-slack-channel-history';
import type { getBulkSlackHistory } from './ai/tools/get-bulk-slack-history';
import type { getSlackThreadReplies } from './ai/tools/get-slack-thread-replies';
import type { InferUITool, UIMessage } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion } from './db/schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Session interface for AI tools (replaces NextAuth Session)
export interface Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    permissions?: string[];
  };
  role?: string | null;
  expires: string;
}

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type searchTranscriptsByKeywordTool = InferUITool<
  ReturnType<typeof searchTranscriptsByKeyword>
>;
type searchTranscriptsByUserTool = InferUITool<
  ReturnType<typeof searchTranscriptsByUser>
>;
type getTranscriptDetailsTool = InferUITool<
  ReturnType<typeof getTranscriptDetails>
>;
type listAccessibleSlackChannelsTool = InferUITool<
  ReturnType<typeof listAccessibleSlackChannels>
>;
type fetchSlackChannelHistoryTool = InferUITool<
  ReturnType<typeof fetchSlackChannelHistory>
>;
type getBulkSlackHistoryTool = InferUITool<
  ReturnType<typeof getBulkSlackHistory>
>;
type getSlackThreadRepliesTool = InferUITool<
  ReturnType<typeof getSlackThreadReplies>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  searchTranscriptsByKeyword: searchTranscriptsByKeywordTool;
  searchTranscriptsByUser: searchTranscriptsByUserTool;
  getTranscriptDetails: getTranscriptDetailsTool;
  listAccessibleSlackChannels: listAccessibleSlackChannelsTool;
  fetchSlackChannelHistory: fetchSlackChannelHistoryTool;
  getBulkSlackHistory: getBulkSlackHistoryTool;
  getSlackThreadReplies: getSlackThreadRepliesTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
