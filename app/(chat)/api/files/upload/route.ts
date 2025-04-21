import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

import { auth } from '@/app/(auth)/auth';

// Validation schema for the file
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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Get filename from formData
    const fileObj = formData.get('file') as File;
    const filename = fileObj.name;
    const fileBuffer = await file.arrayBuffer();
    
    // Create a unique file path to avoid collisions
    const userId = session.user?.id || 'anonymous';
    const timestamp = new Date().getTime();
    const uniqueFilePath = `${userId}/${timestamp}-${filename}`;
    
    // Define the storage bucket
    const bucketName = 'files';
    
    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(uniqueFilePath, fileBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Generate a public URL for the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(uniqueFilePath);

      // Format the response to match Vercel Blob's structure
      const blobLikeResponse = {
        url: publicUrlData.publicUrl,
        downloadUrl: publicUrlData.publicUrl, // Supabase doesn't have separate download URLs
        pathname: uniqueFilePath,
        contentType: file.type,
        contentDisposition: `inline; filename="${filename}"`,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      return NextResponse.json(blobLikeResponse);
    } catch (error) {
      console.error("Upload exception:", error);
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}