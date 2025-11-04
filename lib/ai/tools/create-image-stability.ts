import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { generateUUID } from "@/lib/utils";

type GenerateInput = {
  prompt: string;
  mode?: "text-to-image" | "image-to-image";
  image?: string; // data URL or URL; only used when mode === 'image-to-image'
  strength?: number; // 0..1
  aspect_ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "9:21";
  model?: "sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium" | "sd3.5-flash";
  seed?: number;
  output_format?: "jpeg" | "png" | "webp";
  style_preset?:
    | "3d-model"
    | "analog-film"
    | "anime"
    | "cinematic"
    | "comic-book"
    | "digital-art"
    | "enhance"
    | "fantasy-art"
    | "isometric"
    | "line-art"
    | "low-poly"
    | "modeling-compound"
    | "neon-punk"
    | "origami"
    | "photographic"
    | "pixel-art"
    | "tile-texture";
  negative_prompt?: string;
  cfg_scale?: number; // 1..10
};

async function fileFromInput(image?: string): Promise<{ field: "image"; value: Blob; filename: string } | undefined> {
  if (!image) return undefined;
  try {
    // Support data URLs and remote URLs
    if (image.startsWith("data:")) {
      const [meta, b64] = image.split(",", 2);
      const mime = meta.split(";")[0].replace("data:", "");
      const buf = Buffer.from(b64, "base64");
      return { field: "image", value: new Blob([buf], { type: mime }), filename: `source.${mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg"}` } as any;
    }
    const res = await fetch(image);
    const ct = res.headers.get("content-type") || "image/jpeg";
    const ab = await res.arrayBuffer();
    return { field: "image", value: new Blob([ab], { type: ct }), filename: `source.${ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg"}` } as any;
  } catch {
    return undefined;
  }
}

export function createImageStability(opts?: { dataStream?: UIMessageStreamWriter<any> }) {
  return tool({
    description: "Generate an image using Stability AI SD3.5 (text-to-image or image-to-image).",
    inputSchema: z.object({
      prompt: z.string().min(1).describe("Text prompt for the image"),
      mode: z.enum(["text-to-image", "image-to-image"]).default("text-to-image"),
      image: z.string().url().or(z.string().startsWith("data:")).optional(),
      strength: z.number().min(0).max(1).optional(),
      aspect_ratio: z.enum(["16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"]).optional(),
      model: z.enum(["sd3.5-large", "sd3.5-large-turbo", "sd3.5-medium", "sd3.5-flash"]).default("sd3.5-large"),
      seed: z.number().int().min(0).max(4294967294).optional(),
      output_format: z.enum(["jpeg", "png", "webp"]).default("png"),
      style_preset: z.enum([
        "3d-model",
        "analog-film",
        "anime",
        "cinematic",
        "comic-book",
        "digital-art",
        "enhance",
        "fantasy-art",
        "isometric",
        "line-art",
        "low-poly",
        "modeling-compound",
        "neon-punk",
        "origami",
        "photographic",
        "pixel-art",
        "tile-texture",
      ]).optional(),
      negative_prompt: z.string().max(10000).optional(),
      cfg_scale: z.number().min(1).max(10).optional(),
    }),
    execute: async (input: GenerateInput, ctx: any) => {
      const dataStream = opts?.dataStream || ctx?.dataStream;
      const id = generateUUID();

      // Guard: require API key
  const apiKey = process.env.STABILITY_API_KEY || (process.env as any).STABILITY_KEY || (process.env as any).STABILITYAI_API_KEY;
      if (!apiKey) {
        return { error: "STABILITY_API_KEY not configured" } as any;
      }

  // Do not open the artifact pane; we'll append an assistant message with an inline image instead.

      // Build multipart form
      const form = new FormData();
      form.append("prompt", input.prompt);
      if (input.mode === "image-to-image") {
        const file = await fileFromInput(input.image);
        if (!file) {
          dataStream?.write?.({ type: "data-finish", data: null, transient: true });
          return { error: "image-to-image requires a valid 'image'" } as any;
        }
        // @ts-ignore - web FormData in edge/node
        form.append("image", file.value, file.filename);
        if (typeof input.strength === "number") {
          form.append("strength", String(input.strength));
        }
        form.append("mode", "image-to-image");
      } else {
        form.append("mode", "text-to-image");
        if (input.aspect_ratio) form.append("aspect_ratio", input.aspect_ratio);
      }
      if (input.model) form.append("model", input.model);
      if (input.seed) form.append("seed", String(input.seed));
      if (input.output_format) form.append("output_format", input.output_format);
      if (input.style_preset) form.append("style_preset", input.style_preset);
      if (input.negative_prompt) form.append("negative_prompt", input.negative_prompt);
      if (input.cfg_scale) form.append("cfg_scale", String(input.cfg_scale));

      const endpoint = "https://api.stability.ai/v2beta/stable-image/generate/sd3";

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "image/*",
          },
          body: form as any,
        });

        if (res.status === 200) {
          const ab = await res.arrayBuffer();
          const b64 = Buffer.from(ab).toString("base64");
          if (b64?.length) {
            const assistantMessage = {
              id,
              role: "assistant",
              parts: [
                {
                  type: "image",
                  image: b64,
                  mediaType: input.output_format ? `image/${input.output_format}` : "image/png",
                },
              ],
              metadata: { createdAt: new Date().toISOString() },
            };
            dataStream?.write?.({
              type: "data-appendMessage",
              data: JSON.stringify(assistantMessage),
              transient: true,
            });
            return { ok: true, count: 1, id } as any;
          }
          return { error: "Empty image response from Stability" } as any;
        }

        // Non-200: try to extract text for error
        const ct = res.headers.get("content-type") || "";
        let message = `HTTP ${res.status}`;
        if (ct.includes("application/json")) {
          try {
            const json = await res.json();
            message += `: ${JSON.stringify(json)}`;
          } catch {}
        } else {
          try { message += `: ${await res.text()}`; } catch {}
        }
        return { error: message } as any;
      } catch (err: any) {
        return { error: err?.message || "Stability request failed" } as any;
      }
    },
  });
}
