import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/auth/route-guards";
import {
  getCollection as getChromaCollection,
  existsWithFileHash as chromaExistsWithFileHash,
  deleteByFileId as chromaDeleteByFileId,
  upsertChunks as chromaUpsertChunks,
} from "@/lib/chroma";
import {
  ensureGoogleAccessToken,
  getDriveMetadata,
  exportToPlainText,
  simpleChunk,
  sha256,
} from "@/lib/google/drive";

type Body = {
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  modifiedTime?: string;
  path?: string;
  collection?: string;
  strategy?: "hash-skip" | "purge-reindex";
  chunkSize?: number;
  chunkOverlap?: number;
};

const DEFAULTS = {
  strategy: "hash-skip" as const,
  chunkSize: 800,
  chunkOverlap: 200,
};

export const POST = withAuthApi(async ({ request, session }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const fileId = (body.fileId || "").trim();
    if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });
    const collectionName = (body.collection ?? process.env.CHROMA_COLLECTION ?? "warburg-demo").toString();
    const strategy = body.strategy ?? DEFAULTS.strategy;
    const chunkSize = Number.isFinite(body.chunkSize) ? Number(body.chunkSize) : DEFAULTS.chunkSize;
    const chunkOverlap = Number.isFinite(body.chunkOverlap) ? Number(body.chunkOverlap) : DEFAULTS.chunkOverlap;

    const accessToken = await ensureGoogleAccessToken(session.user.id);

    // Ensure we have file metadata
    let fileName = body.fileName?.toString();
    let mimeType = body.mimeType?.toString();
    if (!fileName || !mimeType) {
      const meta = await getDriveMetadata(fileId, accessToken);
      fileName = fileName || meta.name;
      mimeType = mimeType || meta.mimeType;
    }

    // Export to text
    const text = await exportToPlainText(accessToken, { id: fileId, name: fileName!, mimeType: mimeType! });
    if (!text) return NextResponse.json({ error: "unsupported_mime" }, { status: 400 });

    const fileHash = sha256(text);

    const coll = await getChromaCollection(collectionName);

    if (strategy === "hash-skip") {
      const exists = await chromaExistsWithFileHash(coll, fileId, fileHash);
      if (exists) return NextResponse.json({ ok: true, indexed: false, skipped: true });
    }

    await chromaDeleteByFileId(coll, fileId);

    const chunks = simpleChunk(text, { size: chunkSize, overlap: chunkOverlap });
    const ids = chunks.map((c) => `${fileId}:${c.id}`);
    const metadatas = chunks.map((c) => ({
      fileId,
      fileName: fileName!,
      path: body.path ?? null,
      start: c.start,
      end: c.end,
      modifiedTime: body.modifiedTime ?? null,
      fileHash,
      chunkHash: sha256(c.text),
    }));
    await chromaUpsertChunks(coll, { ids, documents: chunks.map((c) => c.text), metadatas });

    return NextResponse.json({ ok: true, indexed: true, chunks: chunks.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /not connected|access token/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: "Index file failed", details: message }, { status });
  }
});
