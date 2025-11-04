// Chat documents disabled
import { auth } from "@/app/(auth)/auth";
import type { ArtifactKind } from "@/components/artifact";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  return new Response("Not found", { status: 404 });
}

export async function POST() {
  return new Response("Not found", { status: 404 });
}

export async function DELETE() {
  return new Response("Not found", { status: 404 });
}
