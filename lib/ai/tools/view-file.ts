import { tool } from "ai";
import { z } from "zod";
import {
  ensureGoogleAccessToken,
  exportToPlainText,
  getDriveMetadata,
} from "@/lib/google/drive";
import type { Session } from "next-auth";

export const viewFile = (opts: { session: Session }) =>
  tool({
    description: "Fetch the full textual contents of a file by its fileId.",
    inputSchema: z.object({
      fileId: z.string().min(1),
    }),
    execute: async ({ fileId }) => {
      try {
        const userId = opts.session.user?.id;
        if (!userId) return { error: "unauthorized" } as const;

        const accessToken = await ensureGoogleAccessToken(userId);
        const meta = await getDriveMetadata(fileId, accessToken);

        const content = await exportToPlainText(accessToken, meta);
        if (!content) {
          return { error: "unsupported_or_empty" } as const;
        }

        return { fileId, fileName: meta.name, content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `view_file_failed:${message}` } as const;
      }
    },
  });

