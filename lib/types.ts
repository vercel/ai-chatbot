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

export type Doc = {
  id: string;
  title: string;
  source: string;
  updated?: string; // for approved docs
  discovered?: string; // for pending docs
  status: DocStatus;
};

export type AuditItem = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
};

// User management types
export type PlatformRole = "platform_admin" | "user";
export type UserRole = "Admin" | "Editor" | "Viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  platformRole?: PlatformRole; // Platform-level access (admin can manage everything, user is default)
  role?: UserRole; // Legacy role field for invite dialog
  access?: string; // Legacy access field for invite dialog
  lastActive: string;
  twinAssignments?: string[]; // Array of twin IDs this user has access to (via TwinPermission)
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
