import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import { getGoogleDriveClient } from '@/lib/google/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Get Google Drive client
    const drive = await getGoogleDriveClient(databaseUser.id);

    // Search for Google Docs files
    const searchQuery = `mimeType='application/vnd.google-apps.document'${
      query ? ` and name contains '${query.replace(/'/g, "\\'")}'` : ''
    }`;

    const response = await drive.files.list({
      q: searchQuery,
      pageSize: 20,
      fields: 'files(id,name,modifiedTime,webViewLink,iconLink)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];

    return NextResponse.json({
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
      })),
    });
  } catch (error) {
    console.error('Error searching Google Docs:', error);

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

    return NextResponse.json(
      {
        error: 'Failed to search Google Docs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
