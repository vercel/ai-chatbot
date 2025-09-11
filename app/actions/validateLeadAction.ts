"use server";

import { IntentData, IntentDataSchema, LeadValidationResult } from "@/lib/lead/types";
import validateLead from "@/lib/lead/validate";

/** Convert a possible FormData to a plain object */
function formDataToObject(fd: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    obj[k] = typeof v === "string" ? v : String(v);
  }
  return obj;
}

/**
 * Server Action: validates a lead using the deterministic logic.
 * Accepts either a FormData (from form submissions) or a typed IntentData.
 */
export async function validateLeadAction(input: FormData | IntentData): Promise<LeadValidationResult> {
  const dataObj: Partial<IntentData> =
    typeof FormData !== "undefined" && input instanceof FormData
      ? formDataToObject(input as FormData)
      : (input as IntentData);

  // Coerce types and apply defaults via Zod, but if it fails, still respond with structured feedback
  const parsed = IntentDataSchema.safeParse(dataObj);
  let data: IntentData;
  let reasonsFromZod: string[] = [];
  if (!parsed.success) {
    data = {
      name: typeof (dataObj as any).name === "string" ? (dataObj as any).name : "",
      email: typeof (dataObj as any).email === "string" ? (dataObj as any).email : undefined,
      phone: typeof (dataObj as any).phone === "string" ? (dataObj as any).phone : undefined,
      address: typeof (dataObj as any).address === "string" ? (dataObj as any).address : undefined,
      persona:
        (dataObj as any).persona === "owner" || (dataObj as any).persona === "integrator"
          ? ((dataObj as any).persona as "owner" | "integrator")
          : "owner",
      goal:
        (dataObj as any).goal === "viability" || (dataObj as any).goal === "quote" || (dataObj as any).goal === "support" || (dataObj as any).goal === "other"
          ? ((dataObj as any).goal as "viability" | "quote" | "support" | "other")
          : "viability",
      notes: typeof (dataObj as any).notes === "string" ? (dataObj as any).notes : undefined,
    };
    reasonsFromZod = parsed.error.issues.map((i) => i.message);
  } else {
    data = parsed.data;
  }

  const result = validateLead(data);
  const merged: LeadValidationResult = {
    ...result,
    reasons: [...result.reasons, ...reasonsFromZod],
    status:
      result.status === "unsupported_region"
        ? result.status
        : (result.reasons.length || reasonsFromZod.length)
        ? "incomplete"
        : result.status,
  };
  return merged;
}

