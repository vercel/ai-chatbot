import { NextResponse } from "next/server";
import { IntentData, IntentDataSchema } from "@/lib/lead/types";
import validateLead from "@/lib/lead/validate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const parsed = IntentDataSchema.safeParse(body);

    // If the shape/required fields fail (e.g., name too short, invalid email),
    // we still return a structured LeadValidationResult (business-level feedback)
    // rather than hard failing the request, unless it's totally malformed.
    let data: IntentData;
    let reasonsFromZod: string[] = [];
    if (!parsed.success) {
      // Best-effort coercion from provided fields
      const fallback: IntentData = {
        name: typeof body.name === "string" ? body.name : "",
        email: typeof body.email === "string" ? body.email : undefined,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        address: typeof body.address === "string" ? body.address : undefined,
        persona:
          body.persona === "owner" || body.persona === "integrator"
            ? body.persona
            : "owner",
        goal:
          body.goal === "viability" || body.goal === "quote" || body.goal === "support" || body.goal === "other"
            ? body.goal
            : "viability",
        notes: typeof body.notes === "string" ? body.notes : undefined,
      };
      data = fallback;
      reasonsFromZod = parsed.error.issues.map((i) => i.message);
    } else {
      data = parsed.data;
    }

    const result = validateLead(data);
    const merged = {
      ...result,
      reasons: [...result.reasons, ...reasonsFromZod],
      status:
        result.status === "unsupported_region"
          ? result.status
          : (result.reasons.length || reasonsFromZod.length)
          ? "incomplete"
          : result.status,
    } as const;

    return NextResponse.json(merged, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

