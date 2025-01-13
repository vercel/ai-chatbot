import { NextRequest } from "next/server";
import { langchainService } from "@/lib/langchain/service";
import { z } from "zod";

const deleteSchema = z.object({
  userId: z.string().min(1, "UserId is required"),
});

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.API_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = deleteSchema.parse(body);

    await langchainService.initialize(userId);
    await langchainService.deleteUserDocuments(userId);

    return Response.json({
      success: true,
      message: `Successfully deleted all vectors for user: ${userId}`,
    });
  } catch (error) {
    console.error("Error in vector deletion:", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Failed to delete vectors" },
      { status: 500 }
    );
  }
}
