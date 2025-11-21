import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { user } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ai_context, proficiency, ai_tone, ai_guidance } = body;

    const sql = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(sql);

    try {
      // Update user preferences
      await db
        .update(user)
        .set({
          ai_context: ai_context || null,
          proficiency: proficiency || "regular",
          ai_tone: ai_tone || "balanced",
          ai_guidance: ai_guidance || null,
        })
        .where(eq(user.id, authUser.id));

      return NextResponse.json({ success: true });
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(sql);

    try {
      const [userData] = await db
        .select({
          ai_context: user.ai_context,
          proficiency: user.proficiency,
          ai_tone: user.ai_tone,
          ai_guidance: user.ai_guidance,
        })
        .from(user)
        .where(eq(user.id, authUser.id))
        .limit(1);

      return NextResponse.json(userData || {});
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
