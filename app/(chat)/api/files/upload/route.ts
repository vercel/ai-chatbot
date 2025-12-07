import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { auth } from "@/app/(auth)/auth";
import { isAuthDisabled } from "@/lib/constants";

/**
 * Proxy file upload to FastAPI backend (PostgreSQL storage)
 * This route forwards file uploads to the FastAPI backend which stores files in PostgreSQL
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user && !isAuthDisabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return NextResponse.json(
      { error: "Request body is empty" },
      { status: 400 }
    );
  }

  try {
    // Get FastAPI backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const fastApiUrl = `${apiUrl}/api/files/upload`;

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
      const jwtSecret = process.env.JWT_SECRET_KEY;
      if (!jwtSecret) {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

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

    // Forward the form data to FastAPI
    // Note: We need to recreate FormData because Request.formData() can only be read once
    const formData = await request.formData();
    const file = formData.get("file") as File | Blob;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Create new FormData for FastAPI request
    const fastApiFormData = new FormData();
    fastApiFormData.append("file", file);

    // Forward request to FastAPI
    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers,
      body: fastApiFormData,
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Upload failed",
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying file upload to FastAPI:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
