import { tool } from "ai";
import { z } from "zod";
import { getCollection } from "@/lib/chroma";
import { embedBatchVoyage } from "@/lib/voyage";

export const semanticSearch = tool({
  description:
    "Search the user's indexed documents semantically and return matching files.",
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(50).optional().default(10),
    collection: z.string().optional(),
  }),
  execute: async ({ query, limit, collection }) => {
    try {
      const coll = await getCollection(collection);
      // Convert query to an embedding using Voyage
      const [embedding] = await embedBatchVoyage([query], {
        model: "voyage-finance-2",
        inputType: "query",
      });
      const res = (await coll.query({
        queryEmbeddings: [embedding],
        nResults: limit ?? 5,
        include: ["metadatas"],
      } as any)) as any;

      const ids: string[][] = Array.isArray(res?.ids) ? res.ids : [];
      const metadatas: any[][] = Array.isArray(res?.metadatas) ? res.metadatas : [];

      const out: Array<{ fileId: string; fileName: string }> = [];
      const seen = new Set<string>();
      const firstIds = ids[0] || [];
      const firstMetas = metadatas[0] || [];

      for (let i = 0; i < firstIds.length; i++) {
        const id = firstIds[i];
        const meta = firstMetas[i] || {};
        const fileId: string = meta.fileId || (typeof id === "string" ? String(id).split(":")[0] : "");
        const fileName: string = meta.fileName || meta.name || "Untitled";
        if (fileId && !seen.has(fileId)) {
          out.push({ fileId, fileName });
          seen.add(fileId);
        }
      }

      return { results: out };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `semantic_search_failed:${message}` } as const;
    }
  },
});
