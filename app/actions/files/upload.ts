"use server";

import { put } from "@vercel/blob";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export const uploadFile = async (
  formData: FormData
): Promise<
  | {
      data: {
        url: string;
        pathname: string;
        contentType: string;
        contentDisposition: string;
      };
    }
  | { error: string }
> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as Blob;

  if (!file) {
    return { error: "No file uploaded" };
  }

  const validatedFile = FileSchema.safeParse({ file });

  if (!validatedFile.success) {
    const errorMessage = validatedFile.error.errors
      .map((error) => error.message)
      .join(", ");

    return { error: errorMessage };
  }

  // Get filename from formData since Blob doesn't have name property
  const filename = (formData.get("file") as File).name;
  const fileBuffer = await file.arrayBuffer();

  try {
    const data = await put(`${filename}`, fileBuffer, {
      access: "public",
    });

    return { data };
  } catch (_error) {
    return { error: "Upload failed" };
  }
};
