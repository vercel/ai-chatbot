import { type NextRequest, NextResponse } from "next/server";
import { exists, getFileStream } from "@/lib/storage/local";

export function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    // Security check: prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Check if file exists
    if (!exists(filename)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get file stream
    const fileStream = getFileStream(filename);

    // Determine content type based on file extension
    const extension = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";

    switch (extension) {
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
      case "pdf":
        contentType = "application/pdf";
        break;
      case "txt":
        contentType = "text/plain";
        break;
      case "json":
        contentType = "application/json";
        break;
      case "csv":
        contentType = "text/csv";
        break;
      default:
        contentType = "application/octet-stream";
    }

    // Return the file stream
    return new NextResponse(fileStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
