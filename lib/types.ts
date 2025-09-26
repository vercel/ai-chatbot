import { z } from "zod";
import type { getWeather } from "./ai/tools/get-weather";
import type { createDocument } from "./ai/tools/create-document";
import type { updateDocument } from "./ai/tools/update-document";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { InferUITool, UIMessage } from "ai";

import type { ArtifactKind } from "@/components/artifact";
import type { Suggestion } from "./db/schema";
import { createPdf, PDFSchema } from "./ai/tools/create-pdf";
import { ForwardedRef } from "react";

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
type createPdfTool = InferUITool<typeof createPdf>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  createPdf: createPdfTool;
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

export interface TemplateProps {
  headerRef: ForwardedRef<HTMLDivElement>;
  footerRef: ForwardedRef<HTMLDivElement>;
  sum: number;
  children: React.ReactNode;
  content: z.infer<typeof PDFSchema>;
}
