import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { saveUploadedFile, updateFileParsing } from '@/lib/db/queries';
import {
  parseFile,
  getSupportedFileTypes,
  isSupportedFileType,
} from '@/lib/ai/file-parser';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z.instanceof(Blob).refine((file) => file.size <= 5 * 1024 * 1024, {
    message: 'File size should be less than 5MB',
  }),
});

export async function POST(request: Request) {
  console.log('🔄 Starting file upload process...');

  const session = await auth();

  if (!session) {
    console.log('❌ Upload failed: No session found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`👤 User authenticated: ${session.user.id}`);

  if (request.body === null) {
    console.log('❌ Upload failed: Request body is empty');
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      console.log('❌ Upload failed: No file in form data');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    console.log(
      `📁 Processing file: ${filename}, size: ${file.size} bytes, type: ${file.type}`,
    );

    // Validate file type based on filename
    if (!isSupportedFileType(filename)) {
      console.log(`❌ Unsupported file type: ${filename}`);
      return NextResponse.json(
        {
          error: `File type not supported. Supported types: ${getSupportedFileTypes().join(', ')}`,
        },
        { status: 400 },
      );
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      console.log(`❌ File validation failed: ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    console.log(
      `🔄 File validated. Extension: ${fileExtension}, MIME: ${mimeType}`,
    );

    try {
      // Upload file to blob storage
      console.log('🔄 Uploading to blob storage...');
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });
      console.log(`✅ Blob upload successful: ${data.url}`);

      // Save file record to database
      console.log('🔄 Saving file record to database...');
      const savedFile = await saveUploadedFile({
        userId: session.user.id,
        fileName: filename,
        fileType: fileExtension,
        fileSize: file.size,
        fileUrl: data.url,
        mimeType: mimeType || undefined,
      });
      console.log(`✅ Database record saved with ID: ${savedFile.id}`);

      // Parse ALL files with LangChain (including PDFs)
      console.log(`🔄 Parsing file with LangChain: ${filename}`);

      try {
        await updateFileParsing({
          id: savedFile.id,
          parsingStatus: 'processing',
        });

        const parseResult = await parseFile(
          fileBuffer,
          filename,
          mimeType || undefined,
        );

        if (parseResult.success && parseResult.content) {
          await updateFileParsing({
            id: savedFile.id,
            parsedContent: parseResult.content,
            parsingStatus: 'completed',
          });

          console.log(
            `✅ File parsed successfully. Content length: ${parseResult.content.length} characters`,
          );

          return NextResponse.json({
            ...data,
            fileId: savedFile.id,
            parsed: true,
            parsedContent: parseResult.content,
            metadata: parseResult.metadata,
            message: `${filename} uploaded and parsed successfully!`,
          });
        } else {
          await updateFileParsing({
            id: savedFile.id,
            parsingStatus: 'failed',
            parsingError: parseResult.error || 'Unknown parsing error',
          });

          console.log(`❌ File parsing failed: ${parseResult.error}`);
          return NextResponse.json({
            ...data,
            fileId: savedFile.id,
            parsed: false,
            error: parseResult.error,
          });
        }
      } catch (parseError) {
        console.error('❌ File parsing exception:', parseError);
        const errorMessage =
          parseError instanceof Error
            ? parseError.message
            : 'Unknown parsing error';

        await updateFileParsing({
          id: savedFile.id,
          parsingStatus: 'failed',
          parsingError: errorMessage,
        });

        return NextResponse.json({
          ...data,
          fileId: savedFile.id,
          parsed: false,
          error: `File uploaded but parsing failed: ${errorMessage}`,
        });
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return NextResponse.json(
        {
          error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('❌ Failed to process upload request:', error);
    return NextResponse.json(
      {
        error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
