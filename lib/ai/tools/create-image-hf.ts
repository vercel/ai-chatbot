import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { generateUUID } from "@/lib/utils";

export function createImageHF(opts?: { dataStream?: UIMessageStreamWriter<any> }) {
  return tool({
    description: "Generate an image from a text prompt using Hugging Face Inference API (Stable Diffusion).",
    inputSchema: z.object({
      prompt: z.string().min(1).describe("Text prompt for the image"),
    }),
    execute: async (input, ctx: any) => {
      const dataStream = opts?.dataStream || ctx?.dataStream;
      const id = generateUUID();

      const token = process.env.HF_TOKEN;
      if (!token) {
        return { error: "HF_TOKEN is not configured" } as any;
      }

  // Do not open artifact; append assistant message below

      const hfModel = "stabilityai/stable-diffusion-2-1";

      try {
        const res = await fetch(
          `https://api-inference.huggingface.co/models/${hfModel}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "image/png",
            },
            body: JSON.stringify({ inputs: input.prompt }),
          }
        );

  if (!res.ok) {
          const text = await res.text();
          return { error: `HF error ${res.status}: ${text}` } as any;
        }

        const arrayBuf = await res.arrayBuffer();
        const b64 = Buffer.from(arrayBuf).toString("base64");
        if (!b64?.length) {
          return { error: "HF returned empty image" } as any;
        }

        const assistantMessage = {
          id,
          role: "assistant",
          parts: [
            { type: "image", image: b64, mediaType: "image/png" },
          ],
          metadata: { createdAt: new Date().toISOString() },
        };
        dataStream?.write?.({ type: "data-appendMessage", data: JSON.stringify(assistantMessage), transient: true });
        return { ok: true, count: 1, id } as any;
      } catch (err: any) {
        return { error: err?.message || "HF request failed" } as any;
      }
    },
  });
}
