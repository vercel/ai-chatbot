import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { getGoogleDriveClient } from '@/lib/google/client';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the database user
    const databaseUser = await getDatabaseUserFromWorkOS({
      id: user.id,
      email: user.email,
    });

    if (!databaseUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    // Get Google Drive client
    const drive = await getGoogleDriveClient(databaseUser.id);

    // Get file metadata to ensure it exists and user has access
    const fileResponse = await drive.files.get({
      fileId: id,
      fields: 'id,name,mimeType,webViewLink',
    });

    const file = fileResponse.data;

    // Verify it's a Google Doc
    if (file.mimeType !== 'application/vnd.google-apps.document') {
      return NextResponse.json(
        { error: 'File is not a Google Document' },
        { status: 400 },
      );
    }

    // Export the document as Markdown
    const exportResponse = await drive.files.export({
      fileId: id,
      mimeType: 'text/markdown',
    });

    // The response data is the markdown content
    const markdownContent = exportResponse.data as string;

    return NextResponse.json({
      id: file.id,
      name: file.name,
      content: markdownContent,
      webViewLink: file.webViewLink,
    });
  } catch (error) {
    console.error('Error fetching Google Doc content:', error);

    if (
      error instanceof Error &&
      error.message.includes('No Google credentials')
    ) {
      return NextResponse.json(
        {
          error: 'Google Drive not connected',
          message: 'Please authenticate with Google first.',
        },
        { status: 403 },
      );
    }

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Document not found or no access' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch document content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
