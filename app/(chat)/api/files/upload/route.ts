import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
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

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}

// import { NextResponse } from 'next/server';
// import { z } from 'zod';
// import { createClient } from '@supabase/supabase-js';

// import { auth } from '@/app/(auth)/auth';

// // Validation schema for the file
// const FileSchema = z.object({
//   file: z
//     .instanceof(Blob)
//     .refine((file) => file.size <= 5 * 1024 * 1024, {
//       message: 'File size should be less than 5MB',
//     })
//     .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
//       message: 'File type should be JPEG or PNG',
//     }),
// });

// // Initialize Supabase client
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function POST(request: Request) {
//   const session = await auth();

//   if (!session) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   if (request.body === null) {
//     return new Response('Request body is empty', { status: 400 });
//   }

//   try {
//     const formData = await request.formData();
//     const file = formData.get('file') as Blob;

//     if (!file) {
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     const validatedFile = FileSchema.safeParse({ file });

//     if (!validatedFile.success) {
//       const errorMessage = validatedFile.error.errors
//         .map((error) => error.message)
//         .join(', ');

//       return NextResponse.json({ error: errorMessage }, { status: 400 });
//     }

//     // Get filename from formData since Blob doesn't have name property
//     const filename = (formData.get('file') as File).name;
//     const fileBuffer = await file.arrayBuffer();
    
//     // Define the storage bucket and file path
//     const bucketName = 'files'; // Replace with your bucket name
//     const filePath = `${session.user.id}/${filename}`; // Store files with user ID prefix for organization
    
//     try {
//       // Upload to Supabase Storage
//       const { data, error } = await supabase
//         .storage
//         .from(bucketName)
//         .upload(filePath, fileBuffer, {
//           contentType: file.type,
//           upsert: true // Overwrite if the file exists
//         });

//       if (error) {
//         return NextResponse.json({ error: error.message }, { status: 500 });
//       }

//       // Generate a public URL for the uploaded file
//       const { data: publicUrlData } = supabase
//         .storage
//         .from(bucketName)
//         .getPublicUrl(filePath);

//       return NextResponse.json({
//         url: publicUrlData.publicUrl,
//         path: filePath,
//         size: file.size,
//         type: file.type
//       });
//     } catch (error) {
//       return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
//     }
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to process request' },
//       { status: 500 },
//     );
//   }
// }