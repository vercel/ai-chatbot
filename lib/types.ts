export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export type ChatStatus = "idle" | "streaming" | "error";

import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
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
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

// CMS types
export type DocStatus = "Live" | "Pending";

export type ContentType = "pdf" | "doc" | "video" | "website" | "podcast";

export type Doc = {
  id: string;
  title: string;
  source: string;
  updated?: string; // for approved docs
  discovered?: string; // for pending docs
  status: DocStatus;
  // Preview metadata
  contentType?: ContentType;
  description?: string;
  url?: string; // Link to original source
  fileSize?: string; // e.g., "2.5 MB"
  duration?: string; // for video/podcast e.g., "45:30"
  thumbnailUrl?: string; // for video/website
  author?: string;
  publishedDate?: string;
};

export type AuditItem = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
};

// User management types
export type UserRole = "admin" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole; // admin: full CMS and user access, viewer: chat access only
  lastActive: string;
};

// Twins
export type TwinStatus = "active" | "draft" | "placeholder";

export type TrainingStatus = "not_started" | "in_progress" | "complete";

export type TwinCapabilities = {
  text: boolean;
  voice: boolean;
  avatar: boolean;
};

export type TwinPermission = {
  userId: string;
  role: "owner" | "editor" | "viewer"; // owner: full control, editor: can modify, viewer: read-only
};

export type Twin = {
  id: string;
  name: string;
  status: TwinStatus;
  description?: string;
  createdAt?: string;
  knowledgeSources?: string[]; // Doc IDs from knowledge base
  capabilities?: TwinCapabilities;
  trainingStatus?: TrainingStatus;
  avatarId?: string; // HeyGen avatar ID
  voiceId?: string; // Voice model ID
  primarySource?: string; // Initial knowledge source type
  permissions?: TwinPermission[]; // Users who can access/edit this twin
  ownerId?: string; // Primary owner user ID
};

// CMS Scanning types
export type ScanSource = {
  id: string;
  url: string;
  type: "website" | "podcast" | "rss";
  enabled: boolean;
  lastScanned?: string;
};

export type ScanMetadata = {
  lastScanned: string | null;
  isScanning: boolean;
};

export type ScanScheduleFrequency = "12h" | "24h" | "48h" | "weekly" | "manual";

export type ScanSchedule = {
  frequency: ScanScheduleFrequency;
  timeOfDay?: string; // e.g., "03:00" in 24h format
  timezone?: string; // e.g., "EST"
  enabledSources: string[]; // Array of source IDs to include
  nextScanAt?: string; // ISO datetime or formatted string
};

// Discovery types
export type SourceType =
  | "website"
  | "podcast"
  | "rss"
  | "youtube"
  | "newsletter"
  | "linkedin"
  | "news"
  | "press";

export type ScanFrequency =
  | "6h"
  | "12h"
  | "24h"
  | "48h"
  | "weekly"
  | "manual";

export type ScanStatus = "idle" | "scanning" | "success" | "error";

export type Source = {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  frequency: ScanFrequency;
  lastScanned?: string;
  enabled: boolean;
  description?: string;
  scanStatus?: ScanStatus;
  scanProgress?: number; // 0-100
  itemsFound?: number; // Number of items found in last scan
  nextScheduledScan?: string; // ISO datetime
};

export type DiscoveryMethod =
  | "automatic_scan"
  | "perplexity_search"
  | "rss_feed"
  | "manual_addition"
  | "api_integration";

export type DiscoveredItem = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  discoveredAt: string;
  contentType: ContentType;
  description?: string;
  thumbnailUrl?: string;
  author?: string;
  publishedDate?: string;
  discoveryMethod: DiscoveryMethod;
};

// Knowledge types (new architecture)
export type KnowledgeContentType = "file" | "url" | "text";

export type KnowledgeItem = {
  id: string;
  title: string;
  contentType: KnowledgeContentType;
  fileType?: ContentType; // pdf, video, doc, etc.
  uploadedAt: string;
  uploadedBy: string;
  url?: string; // For URL type or file download
  fileName?: string; // Original file name
  fileSize?: string;
  chunksGenerated: number; // How many InsightChunks were created
  textPreview?: string; // First 200 chars for text type
  description?: string;
};
