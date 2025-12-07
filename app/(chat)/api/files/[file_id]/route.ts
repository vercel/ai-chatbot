import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { auth } from "@/app/(auth)/auth";
import { isAuthDisabled } from "@/lib/constants";

/**
 * Proxy file retrieval to FastAPI backend (PostgreSQL storage)
 * This route forwards file requests to the FastAPI backend which serves files from PostgreSQL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file_id: string }> }
) {
  const { file_id } = await params;

  if (!file_id) {
    return NextResponse.json({ error: "File ID required" }, { status: 400 });
  }

  try {
    // Get FastAPI backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const fastApiUrl = `${apiUrl}/api/files/${file_id}`;

    // Prepare headers for FastAPI request
    const headers: HeadersInit = {};

    // Add authentication
    if (isAuthDisabled) {
      // When auth is disabled, send session ID from cookies
      const cookieStore = await cookies();
      const sessionId = cookieStore.get("session_id")?.value;
      if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }
    } else {
      // Generate JWT token for FastAPI
      const session = await auth();
      if (session?.user) {
        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (jwtSecret) {
          const token = jwt.sign(
            {
              sub: session.user.id,
              type: session.user.type || "regular",
            },
            jwtSecret,
            {
              expiresIn: "30m",
              algorithm: "HS256",
            }
          );

          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }

    // Forward request to FastAPI
    const response = await fetch(fastApiUrl, {
      method: "GET",
      headers,
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "File not found",
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    // Get file data and content type
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition");

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentDisposition && { "Content-Disposition": contentDisposition }),
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error proxying file retrieval to FastAPI:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 }
    );
  }
}
