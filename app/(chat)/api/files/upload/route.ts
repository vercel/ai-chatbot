import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';

import { auth } from '@/app/(auth)/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Accept images, documents, and data files
    .refine((file) => [
      // Images
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      // Documents
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'text/markdown',
      // Microsoft Office
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      // Legacy Office
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
      // Code files
      'text/javascript',
      'text/html',
      'text/css',
      'application/xml',
      'text/xml',
    ].includes(file.type), {
      message: 'File type not supported. Supported: Images (JPEG, PNG, GIF, WebP), Documents (PDF, TXT, CSV, JSON, MD), Office files (DOC, XLS, PPT), and Code files',
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

    console.log('📁 File upload attempt:', {
      name: (formData.get('file') as File)?.name,
      type: file.type,
      size: file.size,
    });

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      console.log('❌ File validation failed:', errorMessage);
      console.log('🔍 Validation errors:', validatedFile.error.errors);

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    // Use local storage in development if no Vercel Blob token
    const useLocalStorage = !process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV === 'development';

    try {
      if (useLocalStorage) {
        console.log('💾 Using local file storage for development...');
        
        // Generate unique filename to avoid conflicts
        const timestamp = Date.now();
        const safeFilename = `${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadPath = join(process.cwd(), 'public', 'uploads', safeFilename);
        
        // Ensure uploads directory exists
        await writeFile(uploadPath, Buffer.from(fileBuffer)).catch(async (err) => {
          if (err.code === 'ENOENT') {
            // Create uploads directory if it doesn't exist
            const { mkdir } = await import('fs/promises');
            await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true });
            await writeFile(uploadPath, Buffer.from(fileBuffer));
          } else {
            throw err;
          }
        });

        const url = `/uploads/${safeFilename}`;
        console.log('✅ Local upload successful:', url);
        
        return NextResponse.json({
          url,
          downloadUrl: url,
          pathname: safeFilename,
          size: fileBuffer.byteLength,
        });
      } else {
        console.log('☁️ Uploading to Vercel Blob...');
        const data = await put(`${filename}`, fileBuffer, {
          access: 'public',
        });

        console.log('✅ Upload successful:', data.url);
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return NextResponse.json({ 
        error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
