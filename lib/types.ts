import { z } from 'zod/v4';
import type { getWeather } from './ai/tools/get-weather';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { searchTranscriptsByKeyword } from './ai/tools/search-transcripts-by-keyword';
import type { searchTranscriptsByUser } from './ai/tools/search-transcripts-by-user';
import type { getTranscriptDetails } from './ai/tools/get-transcript-details';
import type { listAccessibleSlackChannels } from './ai/tools/list-accessible-slack-channels';
import type { fetchSlackChannelHistory } from './ai/tools/fetch-slack-channel-history';
import type { getBulkSlackHistory } from './ai/tools/get-bulk-slack-history';
import type { listGoogleCalendarEvents } from './ai/tools/list-google-calendar-events';
import type { listGmailMessages } from './ai/tools/list-gmail-messages';
import type { getGmailMessageDetails } from './ai/tools/get-gmail-message-details';
import type { getMem0Projects } from './ai/tools/get-mem0-projects';
import type { getMem0Memories } from './ai/tools/get-mem0-memories';
import type { createMem0Project } from './ai/tools/create-mem0-project';
import type { createMem0Memory } from './ai/tools/create-mem0-memory';
import type { getSlackThreadReplies } from './ai/tools/get-slack-thread-replies';
import type { InferUITool, LanguageModelUsage, UIMessage } from 'ai';

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
type listGoogleCalendarEventsTool = InferUITool<
  ReturnType<typeof listGoogleCalendarEvents>
>;
type listGmailMessagesTool = InferUITool<ReturnType<typeof listGmailMessages>>;
type getGmailMessageDetailsTool = InferUITool<
  ReturnType<typeof getGmailMessageDetails>
>;
type getMem0ProjectsTool = InferUITool<ReturnType<typeof getMem0Projects>>;
type getMem0MemoriesTool = InferUITool<ReturnType<typeof getMem0Memories>>;
type createMem0ProjectTool = InferUITool<ReturnType<typeof createMem0Project>>;
type createMem0MemoryTool = InferUITool<ReturnType<typeof createMem0Memory>>;
type fileSearchTool = {
  input: { query: string };
  output: unknown;
};
type getFileContentsTool = {
  input: { file_id: string };
  output: unknown;
};

export type ChatTools = {
  getWeather: weatherTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  searchTranscriptsByKeyword: searchTranscriptsByKeywordTool;
  searchTranscriptsByUser: searchTranscriptsByUserTool;
  getTranscriptDetails: getTranscriptDetailsTool;
  listAccessibleSlackChannels: listAccessibleSlackChannelsTool;
  fetchSlackChannelHistory: fetchSlackChannelHistoryTool;
  getBulkSlackHistory: getBulkSlackHistoryTool;
  getSlackThreadReplies: getSlackThreadRepliesTool;
  listGoogleCalendarEvents: listGoogleCalendarEventsTool;
  listGmailMessages: listGmailMessagesTool;
  getGmailMessageDetails: getGmailMessageDetailsTool;
  getMem0Projects: getMem0ProjectsTool;
  getMem0Memories: getMem0MemoriesTool;
  createMem0Project: createMem0ProjectTool;
  createMem0Memory: createMem0MemoryTool;
  file_search: fileSearchTool;
  get_file_contents: getFileContentsTool;
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
  usage: LanguageModelUsage;
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
