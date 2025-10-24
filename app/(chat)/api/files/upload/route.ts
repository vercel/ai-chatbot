import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

// Initialize UTApi with explicit token from environment
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

// Use Blob instead of File since File is not available in Node.js environment
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 32 * 1024 * 1024, {
      message: "File size should be less than 32MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ALLOWED_TYPES.includes(file.type), {
      message: `File type should be one of: ${ALLOWED_TYPES.join(", ")}`,
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const fileBlob = formData.get("file");

    if (!fileBlob) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Some runtimes will provide a File object (with name), others only a Blob.
    const file = fileBlob as Blob;

    const validatedFile = FileSchema.safeParse({ file });
    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Try to read filename; fallback to a generated one
    let filename = "upload";
    try {
      const maybeFile = fileBlob as File;
      filename = maybeFile.name || filename;
    } catch (_) {
      // ignore and use fallback
    }

    try {
      // Create a File object for UploadThing
      const uploadFile = new File([file], filename, {
        type: file.type,
      });

      // Upload to UploadThing
      const response = await utapi.uploadFiles([uploadFile]);

      if (response[0]?.data) {
        const uploadedFile = response[0].data;
        return NextResponse.json({
          url: uploadedFile.url,
          pathname: uploadedFile.name,
          contentType: file.type,
          key: uploadedFile.key,
        });
      }

      // Handle upload error
      const error = response[0]?.error;
      throw new Error(error?.message || "Upload failed");
    } catch (error) {
      // Provide error message during development for easier debugging
      const message =
        error instanceof Error
          ? error.message
          : "Upload failed due to unknown error";
      if (process.env.NODE_ENV === "development") {
        console.error("Upload error:", error);
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to process upload request:", error);
    }
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
