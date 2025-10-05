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
  resolveOrCreateFolder,
  listFilesRecursive,
  exportToPlainText,
  simpleChunk,
  sha256,
  type DriveFileWithPath,
} from "@/lib/google/drive";

// Endpoint defaults
const DEFAULTS = {
  folderPath: "warburg-demo",
  collection: "warburg-demo",
  strategy: "hash-skip" as const,
  maxDepth: 5,
  chunkSize: 1000,
  chunkOverlap: 200,
};

export type RunBody = {
  folderPath?: string;
  collection?: string;
  limit?: number;
  dryRun?: boolean;
  strategy?: "hash-skip" | "purge-reindex";
  maxDepth?: number;
  chunkSize?: number;
  chunkOverlap?: number;
};

export const POST = withAuthApi(async ({ request, session }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as RunBody;
    const folderPath = (body.folderPath ?? process.env.GOOGLE_DRIVE_DEMO_FOLDER_ID ?? DEFAULTS.folderPath).toString();
    const collection = (body.collection ?? process.env.CHROMA_COLLECTION ?? DEFAULTS.collection).toString();
    const limit = Math.max(1, Math.min(1000, Number(body.limit ?? 100)));
    const dryRun = Boolean(body.dryRun ?? false);
    const strategy = body.strategy ?? DEFAULTS.strategy;
    const maxDepth = Number.isFinite(body.maxDepth) ? Number(body.maxDepth) : DEFAULTS.maxDepth;
    const chunkSize = Number.isFinite(body.chunkSize) ? Number(body.chunkSize) : DEFAULTS.chunkSize;
    const chunkOverlap = Number.isFinite(body.chunkOverlap) ? Number(body.chunkOverlap) : DEFAULTS.chunkOverlap;

    const accessToken = await ensureGoogleAccessToken(session.user.id);

    const folderId = await resolveOrCreateFolder(accessToken, folderPath);
    if (!folderId) {
      return NextResponse.json({ error: "Folder not specified or resolvable" }, { status: 400 });
    }

    const all: DriveFileWithPath[] = [];
    await listFilesRecursive(accessToken, folderId, all, 0, [], maxDepth);
    const files = all.filter((f) => f.mimeType !== "application/vnd.google-apps.folder");

    let attempted = 0;
    let indexed = 0;
    let skipped = 0;
    let unsupported = 0;
    let failed = 0;
    const errors: Array<{ id: string; name: string; error: string }> = [];

    const coll = await getChromaCollection(collection);

    for (const f of files) {
      if (attempted >= limit) break;
      attempted += 1;

      try {
        if (dryRun) {
          indexed += 1;
          continue;
        }

        const text = await exportToPlainText(accessToken, f);
        if (!text) {
          unsupported += 1;
          continue;
        }

        const fileHash = sha256(text);

        if (strategy === "hash-skip") {
          const exists = await chromaExistsWithFileHash(coll, f.id, fileHash);
          if (exists) {
            skipped += 1;
            continue;
          }
        }

        await chromaDeleteByFileId(coll, f.id);

        const chunks = simpleChunk(text, { size: chunkSize, overlap: chunkOverlap });
        const ids = chunks.map((c) => `${f.id}:${c.id}`);
        const metadatas = chunks.map((c) => ({
          fileId: f.id,
          fileName: f.name,
          path: f.path,
          start: c.start,
          end: c.end,
          modifiedTime: f.modifiedTime ?? null,
          fileHash,
          chunkHash: sha256(c.text),
        }));
        await chromaUpsertChunks(coll, { ids, documents: chunks.map((c) => c.text), metadatas });
        indexed += 1;
      } catch (e) {
        failed += 1;
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ id: f.id, name: f.name, error: msg });
      }
    }

    return NextResponse.json({ ok: true, total: files.length, attempted, indexed, skipped, unsupported, failed, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /not connected|access token/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: "Index run failed", details: message }, { status });
  }
});
