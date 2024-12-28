import { Client } from "langsmith";
import { NextResponse } from "next/server";

const langsmith = new Client({
  apiKey: process.env.LANGCHAIN_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { runId, score, comment } = await req.json();

    await langsmith.createFeedback(runId, "user-feedback", {
      score,
      comment,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save LangSmith feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
