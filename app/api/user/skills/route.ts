import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: skills, error } = await supabase
      .from("ai_skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching skills:", error);
      return NextResponse.json(
        { error: "Failed to fetch skills" },
        { status: 500 }
      );
    }

    return NextResponse.json({ skills: skills || [] });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, prompt } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Name and prompt are required" },
        { status: 400 }
      );
    }

    const { data: skill, error } = await supabase
      .from("ai_skills")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        prompt,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating skill:", error);
      return NextResponse.json(
        { error: "Failed to create skill" },
        { status: 500 }
      );
    }

    return NextResponse.json({ skill });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}
