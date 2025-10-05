import { CloudClient, type Collection, type IncludeEnum, type Metadata } from "chromadb";
import { embedBatchVoyage } from "@/lib/voyage";

function required(name: string, value?: string) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export function getChromaClient(): CloudClient {
  const apiKey = required("CHROMA_API_KEY", process.env.CHROMA_API_KEY);
  const tenant = required("CHROMA_TENANT", process.env.CHROMA_TENANT);
  const database = required("CHROMA_DATABASE", process.env.CHROMA_DATABASE);
  return new CloudClient({ apiKey, tenant, database });
}

export async function getCollection(name?: string): Promise<Collection> {
  const client = getChromaClient();
  const collName = (name || process.env.CHROMA_COLLECTION || "all-docs").trim();
  // Avoid loading default embedding packages by explicitly setting embeddingFunction to null.
  return client.getOrCreateCollection({
    name: collName,
    embeddingFunction: null,
    configuration: { hnsw: { space: "cosine" } },
  });
}

export async function existsWithFileHash(
  collection: Collection,
  fileId: string,
  fileHash: string
): Promise<boolean> {
  const res = await collection.get({
    where: { $and: [{ fileId }, { fileHash }] } as any,
    include: ["metadatas"] as IncludeEnum[],
    limit: 1,
  });
  const mats = (res as any)?.metadatas;
  const flat = Array.isArray(mats) ? mats.flat().filter(Boolean) : [];
  return flat.length > 0;
}

export async function deleteByFileId(collection: Collection, fileId: string): Promise<void> {
  await collection.delete({ where: { fileId } });
}

export async function upsertChunks(
  collection: Collection,
  args: { ids: string[]; documents: string[]; metadatas?: Metadata[] }
) {
  const { ids, documents, metadatas } = args;
  const embeddings = await embedBatchVoyage(documents, {
    model: "voyage-finance-2",
    inputType: "document",
  });
  await collection.upsert({ ids, embeddings, metadatas, documents });
}
