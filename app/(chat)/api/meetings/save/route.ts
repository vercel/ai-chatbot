import { NextRequest, NextResponse } from "next/server";
import { withAuthApi } from "@/lib/auth/route-guards";
import {
  ensureGoogleAccessToken,
  resolveOrCreateFolder,
} from "@/lib/google/drive";

type SaveBody = {
  title?: string;
  transcriptText?: string;
  folderId?: string; // can be path like "warburg-demo/meetings" or a Drive folder ID
};

export const POST = withAuthApi(async ({ request, session }) => {
  try {
    const body = (await request.json()) as SaveBody;
    const title = (body.title || "").trim();
    const transcriptText = (body.transcriptText || "").trim();
    const folderInput = (body.folderId || process.env.GOOGLE_DRIVE_DEMO_FOLDER_ID || "").trim() || undefined;

    if (!title || !transcriptText) {
      return NextResponse.json(
        { error: "Missing title or transcriptText" },
        { status: 400 }
      );
    }

    const accessToken = await ensureGoogleAccessToken(session.user.id);

    // Resolve folder (path or ID)
    const folderId = await resolveOrCreateFolder(accessToken, folderInput);

    // Build multipart/related upload with Google Doc target mimeType
    const boundary = "boundary-" + Math.random().toString(36).slice(2);
    const metadata: Record<string, unknown> = {
      name: title,
      mimeType: "application/vnd.google-apps.document",
    };
    if (folderId) metadata.parents = [folderId];

    const delimiter = `--${boundary}`;
    const closeDelimiter = `--${boundary}--`;
    const multipartBody = [
      delimiter,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(metadata),
      delimiter,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      transcriptText,
      closeDelimiter,
      "",
    ].join("\r\n");

    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";
    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!uploadResp.ok) {
      const errText = await uploadResp.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to create Drive file", details: errText },
        { status: uploadResp.status }
      );
    }

    const data = (await uploadResp.json()) as { id: string };
    const res = NextResponse.json({ driveFileId: data.id });

    // Best-effort: trigger indexing of the created file, forwarding cookies for auth
    (async () => {
      try {
        const indexUrl = new URL("/api/drive/index/file", (request as NextRequest).url);
        await fetch(indexUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: (request as NextRequest).headers.get("cookie") || "",
          },
          body: JSON.stringify({
            fileId: data.id,
            fileName: title,
            path: typeof body.folderId === "string" ? body.folderId : process.env.GOOGLE_DRIVE_DEMO_FOLDER_ID || null,
          }),
        });
      } catch {}
    })();

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save meeting transcript", details: message },
      { status: 500 }
    );
  }
});

