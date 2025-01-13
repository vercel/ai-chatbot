import { NextRequest } from "next/server";
import { langchainService } from "@/lib/langchain/service";
import { z } from "zod";

const ingestSchema = z.object({
  text: z.string().min(1, "Text content is required"),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.API_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, metadata = {} } = ingestSchema.parse(body);

    await langchainService.initialize(metadata.userId);
    const chunkCount = await langchainService.ingestDocument(text, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      chunkCount,
      message: `Successfully processed document into ${chunkCount} chunks`,
    });
  } catch (error) {
    console.error("Error in text ingestion:", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
