import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });
    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData (File objects have a name property)
    const filename = (formData.get('file') as File).name;

    // Optionally, if you need to construct a File from the Blob (Node.js may not have a built-in File)
    // you might consider polyfilling or using a library. However, in Next.js app directory the File
    // interface is usually available in API routes.

    // Convert the Blob into a File-like object by providing the filename and metadata.
    const fileWithName = new File([file], filename, {
      type: file.type,
      lastModified: Date.now(),
    });

    try {
      const uploadResult = await utapi.uploadFiles(fileWithName);
      return NextResponse.json({
        ...uploadResult.data,
      });
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
