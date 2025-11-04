import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { generateUUID } from "@/lib/utils";

// We use @google/genai client directly for Imagen image generation
// The same Google key used elsewhere (GOOGLE_GENERATIVE_AI_API_KEY | GOOGLE_API_KEY) will be picked up by the SDK
export function createImage(opts?: { dataStream?: UIMessageStreamWriter<any> }) {
  return tool({
    description: "Generate an image from a text prompt using Google Imagen.",
    inputSchema: z.object({
      prompt: z.string().min(1).describe("Text prompt for the image"),
      numberOfImages: z.number().int().min(1).max(4).default(1),
      size: z.enum(["1024x1024", "768x768", "512x512"]).optional(),
    }),
    // Append an inline assistant message with a base64 image in chat; do not use artifact panel
    execute: async (input, ctx: any) => {
      const dataStream = opts?.dataStream || ctx?.dataStream;
      const id = generateUUID();

      // @ts-ignore: optional dependency without bundled type declarations
      const { GoogleGenAI } = await import("@google/genai") as any;

      const ai = new GoogleGenAI({
        apiKey:
          process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
      } as any);

      let response: any;
      try {
        response = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: input.prompt,
        config: {
          numberOfImages: input.numberOfImages ?? 1,
          ...(input.size ? { size: input.size } : {}),
        },
        } as any);
      } catch (err: any) {
        // Attempt OSS fallback via Hugging Face if available
        if (process.env.HF_TOKEN) {
          try {
            const hfModel = "stabilityai/stable-diffusion-2-1";
            const res = await fetch(
              `https://api-inference.huggingface.co/models/${hfModel}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.HF_TOKEN}`,
                  "Content-Type": "application/json",
                  Accept: "image/png",
                },
                body: JSON.stringify({ inputs: input.prompt }),
              }
            );

            if (!res.ok) {
              const text = await res.text();
              return { error: `HF fallback failed: ${res.status} ${text}` } as any;
            }

            const arrayBuf = await res.arrayBuffer();
            const b64 = Buffer.from(arrayBuf).toString("base64");
            if (b64?.length) {
              const assistantMessage = {
                id,
                role: "assistant",
                parts: [
                  {
                    type: "image",
                    image: b64,
                    mediaType: "image/png",
                  },
                ],
                metadata: { createdAt: new Date().toISOString() },
              };
              dataStream?.write?.({ type: "data-appendMessage", data: JSON.stringify(assistantMessage), transient: true });
              return { ok: true, count: 1, fallback: "hf" } as any;
            }

            return { error: "HF fallback returned empty image" } as any;
          } catch (hfErr: any) {
            return { error: hfErr?.message || "HF fallback error" } as any;
          }
        }

        // No fallback available; surface clean error
        return { error: err?.message || "Image generation failed (billing or access)" } as any;
      }

      // Emit an assistant message with the generated image
      let idx = 0;
      for (const generatedImage of (response as any).generatedImages || []) {
        const imgBytes = generatedImage.image?.imageBytes;
        if (typeof imgBytes === "string" && imgBytes.length > 0) {
          const assistantMessage = {
            id,
            role: "assistant",
            parts: [
              {
                type: "image",
                image: imgBytes,
                mediaType: "image/png",
              },
            ],
            metadata: { createdAt: new Date().toISOString() },
          };
          dataStream?.write?.({ type: "data-appendMessage", data: JSON.stringify(assistantMessage), transient: true });
          idx++;
        }
      }

      if (idx === 0) {
        return { error: "No image returned by Imagen." } as any;
      }

      // Final result structure
      return { ok: true, count: idx, id } as any;
    },
  });
}
