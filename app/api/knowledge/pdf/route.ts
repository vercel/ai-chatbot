import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument } from '@/lib/db/queries';
import { processDocumentLocal } from '@/lib/knowledge/localFiles/documentProcessor';
import { savePdfFile } from '@/lib/knowledge/localFiles/pdfFileHandler';

// Disable static optimization for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('PDF route received a POST request');
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const pdfFile = formData.get('file') as File;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Verify file type (optional)
    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Create the document in the database
    const document = await createKnowledgeDocument({
      userId: session.user.id,
      title,
      description,
      sourceType: 'pdf',
      sourceUrl: '',
      fileSize: (pdfFile.size / 1024).toFixed(2) + ' KB',
      fileType: pdfFile.type || 'application/pdf',
    });
    
    console.log(`Created PDF document in database: ${document.id}`);
    
    // Save the PDF file
    const filePath = await savePdfFile(pdfFile, session.user.id, document.id);
    console.log(`Saved PDF file to ${filePath}`);

    // Start processing in the background
    processDocumentLocal({
      document,
      userId: session.user.id,
      filePath: filePath,
    }).catch(error => {
      console.error('Error processing PDF file:', error);
    });

    return NextResponse.json({
      ...document,
      message: 'PDF file uploaded and processing started',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating PDF document:', error);
    return NextResponse.json(
      { error: 'Failed to create PDF document' },
      { status: 500 }
    );
  }
}