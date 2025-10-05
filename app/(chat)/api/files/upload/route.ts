import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fileTypeFromBuffer } from "file-type";

import { withAuthApi } from "@/lib/auth/route-guards";
import { ChatSDKError } from "@/lib/errors";

// Accepted MIME types for uploads
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/csv", // .csv
  "application/vnd.ms-excel", // some browsers label CSV this way
] as const;

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Basic content-type check; further validated via magic bytes below
    .refine((file) => !file.type || ACCEPTED_MIME_TYPES.includes(file.type as any), {
      message:
        "Unsupported file type. Allowed: JPEG, PNG, PDF, DOCX, XLSX, CSV",
    }),
});

export const POST = withAuthApi(async ({ request }) => {

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    // Extra safety: detect MIME type from magic bytes
    const detected = await fileTypeFromBuffer(Buffer.from(fileBuffer)).catch(
      () => undefined,
    );
    if (detected?.mime && !ACCEPTED_MIME_TYPES.includes(detected.mime as any)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file content. Allowed: JPEG, PNG, PDF, DOCX, XLSX, CSV",
        },
        { status: 400 },
      );
    }

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: "public",
      });

      return NextResponse.json(data);
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}, {
  onUnauthorized: () => new ChatSDKError("unauthorized:api").toResponse(),
});
