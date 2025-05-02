import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '../../../../lib/firebase/storage';

export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 10) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 },
      );
    }

    // Upload file to Firebase Storage
    const fileDetails = await uploadFile(file);

    // Return the file details
    return NextResponse.json(fileDetails);
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 },
    );
  }
}
