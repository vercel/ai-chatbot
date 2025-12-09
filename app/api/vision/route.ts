/**
 * TiQology Nexus API - Vision Endpoint
 * Multimodal vision analysis and generation
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  analyzeDiagram,
  analyzeImage,
  analyzeUIScreenshot,
  extractCode,
  generateImage,
  getVisionEngine,
} from "@/lib/visionEngine";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "analyze": {
        try {
          const analysis = await analyzeImage(data.imageUrl, data.prompt);
          return NextResponse.json({ analysis });
        } catch (error) {
          return NextResponse.json({
            analysis: {
              description: "Configure OpenAI API key to enable image analysis",
              objects: ["Waiting for API key"],
              colors: ["#000000"],
              suggestions: ["Add OPENAI_API_KEY to environment variables"],
            },
          });
        }
      }

      case "analyze-screenshot": {
        try {
          const screenshot = await analyzeUIScreenshot(data.imageUrl);
          return NextResponse.json({ analysis: screenshot });
        } catch (error) {
          return NextResponse.json({
            analysis: {
              issues: [
                {
                  type: "setup",
                  severity: "high" as const,
                  description: "OpenAI API not configured",
                  fix: "Add OPENAI_API_KEY to enable UI analysis",
                },
              ],
            },
          });
        }
      }

      case "analyze-diagram": {
        const diagram = await analyzeDiagram(data.imageUrl);
        return NextResponse.json({ analysis: diagram });
      }

      case "extract-code": {
        const code = await extractCode(data.imageUrl);
        return NextResponse.json({ code });
      }

      case "generate": {
        const images = await generateImage({
          prompt: data.prompt,
          style: data.style,
          size: data.size,
          quality: data.quality,
          n: data.n,
        });
        return NextResponse.json({ images });
      }

      case "compare": {
        const engine = getVisionEngine();
        const comparison = await engine.compareImages(
          data.imageUrl1,
          data.imageUrl2
        );
        return NextResponse.json({ comparison });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[API] Vision error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
