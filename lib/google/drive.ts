import crypto from "node:crypto";
import { getAccessTokenForUser } from "@/lib/google/tokens";

export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime?: string; parents?: string[] };
export type DriveFileWithPath = DriveFile & { path: string };

export const DRIVE_FILES_API = "https://www.googleapis.com/drive/v3/files";

export async function ensureGoogleAccessToken(userId: string): Promise<string> {
  const accessToken = await getAccessTokenForUser(userId);
  if (!accessToken) throw new Error("Google Drive not connected");
  return accessToken;
}

export function looksLikeDriveId(value: string) {
  return /^[A-Za-z0-9_-]{20,}$/.test(value);
}

export async function resolveOrCreateFolder(accessToken: string, input?: string): Promise<string | undefined> {
  if (!input) return undefined;
  if (looksLikeDriveId(input)) return input;
  const parts = input.split("/").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  let parentId = "root";
  for (const name of parts) {
    const existing = await findFolderByName(accessToken, name, parentId);
    if (existing) {
      parentId = existing;
      continue;
    }
    parentId = await createFolder(accessToken, name, parentId);
  }
  return parentId;
}

export async function findFolderByName(accessToken: string, name: string, parentId: string): Promise<string | null> {
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const url = `${DRIVE_FILES_API}?q=${encodeURIComponent(q)}&fields=files(id,name)`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!resp.ok) return null;
  const data = (await resp.json().catch(() => ({} as any))) as any;
  const file = data?.files?.[0];
  return file?.id || null;
}

export async function createFolder(accessToken: string, name: string, parentId: string): Promise<string> {
  const resp = await fetch(DRIVE_FILES_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  if (!resp.ok) throw new Error(`Failed to create folder '${name}': ${await resp.text()}`);
  const data = (await resp.json()) as { id: string };
  return data.id;
}

export async function listFilesRecursive(
  accessToken: string,
  folderId: string,
  out: DriveFileWithPath[],
  depth = 0,
  ancestors: string[] = [],
  maxDepth = 5
): Promise<void> {
  if (depth > maxDepth) return;
  const q = `'${folderId}' in parents and trashed=false`;
  const url = `${DRIVE_FILES_API}?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,parents)`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!resp.ok) throw new Error(`Drive list error: ${await resp.text()}`);
  const data = (await resp.json()) as { files?: DriveFile[] };
  const files = data.files || [];
  for (const f of files) {
    const path = [...ancestors, f.name].join(" / ");
    out.push({ ...(f as DriveFile), path });
    if (f.mimeType === "application/vnd.google-apps.folder") {
      await listFilesRecursive(accessToken, f.id, out, depth + 1, [...ancestors, f.name], maxDepth);
    }
  }
}

export async function exportToPlainText(accessToken: string, file: DriveFile): Promise<string | null> {
  if (file.mimeType === "application/vnd.google-apps.document") {
    const url = `${DRIVE_FILES_API}/${file.id}/export?mimeType=${encodeURIComponent("text/plain")}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) return null;
    return await resp.text();
  }
  if (file.mimeType?.startsWith("text/")) {
    const url = `${DRIVE_FILES_API}/${file.id}?alt=media`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) return null;
    return await resp.text();
  }
  return null;
}

export async function getDriveMetadata(fileId: string, accessToken: string) {
  const url = `${DRIVE_FILES_API}/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!resp.ok) throw new Error(`metadata_failed:${resp.status}:${await resp.text()}`);
  return (await resp.json()) as { id: string; name: string; mimeType: string; modifiedTime?: string };
}

export function simpleChunk(text: string, opts: { size: number; overlap: number }) {
  const { size, overlap } = opts;
  const chunks: { id: string; text: string; start: number; end: number }[] = [];
  let i = 0;
  let idx = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + size);
    const chunk = text.slice(i, end);
    chunks.push({ id: `c${idx}`, text: chunk, start: i, end });
    idx += 1;
    if (end === text.length) break;
    i = Math.max(0, end - overlap);
  }
  return chunks;
}

export function sha256(text: string): string {
  const h = crypto.createHash("sha256");
  h.update(text);
  return h.digest("hex");
}

