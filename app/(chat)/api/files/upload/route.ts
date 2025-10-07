import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { PutBlobResult } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

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
    const contentType = file.type;
    const fileBuffer = await file.bytes();

    try {
      if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
        console.error("S3 credentials are not set");
        return NextResponse.json(
          { error: "S3 credentials are not set" },
          { status: 500 }
        );
      }

      if (!process.env.S3_REGION) {
        console.error("S3 region is not set");
        return NextResponse.json(
          { error: "S3 region is not set" },
          { status: 500 }
        );
      }

      const s3 = new S3Client({
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        // This is important for MinIO
        forcePathStyle: true,
        endpoint: process.env.S3_ENDPOINT,
      });

      const ext =
        filename.indexOf(".") !== -1 ? filename.split(".").pop() : "dat";
      const now = new Date();
      const key =
        "upload/" +
        new Date().getFullYear() +
        "/" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "/" +
        String(now.getDate()).padStart(2, "0") +
        "/" +
        Date.now() +
        "." +
        ext;

      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType ?? "application/octet-stream",
        ACL: "public-read",
        CacheControl: `public, max-age=${365 * 24 * 60 * 60}, immutable`,
      });

      await s3.send(putObjectCommand);
      const publicUrl = process.env.S3_ENDPOINT
        ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}` // Consider it is a MinIO instance
        : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

      return NextResponse.json({
        url: publicUrl,
        pathname: key,
        contentType,
      });
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
