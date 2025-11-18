import { NextResponse } from "next/server";
import { streamObject } from "ai";
import { z } from "zod";
import { myProvider } from "@/lib/ai/providers";

export async function POST(request: Request) {
  try {
    const { description, type } = await request.json();

    if (!description || type !== "fields") {
      return NextResponse.json(
        { error: "Description and type are required" },
        { status: 400 }
      );
    }

    const { object } = await streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: `You are a database schema expert. Generate appropriate database fields/columns for a table based on the user's description. 
      Return an array of field objects with: field_name (snake_case), display_name, data_type (text, integer, uuid, boolean, timestamp, date, numeric, json, jsonb), 
      is_required (boolean), is_unique (boolean), and optional description. Always include an 'id' field of type 'uuid' as the primary key.`,
      prompt: `Generate database fields for a table with this description: ${description}`,
      schema: z.object({
        fields: z.array(
          z.object({
            field_name: z.string(),
            display_name: z.string().optional(),
            data_type: z.string(),
            is_required: z.boolean().optional(),
            is_unique: z.boolean().optional(),
            description: z.string().optional(),
            default_value: z.unknown().optional(),
          })
        ),
      }),
    });

    const result = await object;
    return NextResponse.json({ fields: result.fields });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate fields" },
      { status: 500 }
    );
  }
}

