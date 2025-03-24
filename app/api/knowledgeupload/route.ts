import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument, createKnowledgeChunk } from '@/lib/db/queries';

// Ensure dynamic rendering and disable caching
export const dynamic = 'force-dynamic';

/**
 * Simplified API endpoint with basic chunk creation
 */
export async function POST(req: NextRequest) {
  console.log('[KNOWLEDGEUPLOAD] POST request received');
  
  try {
    // Get user session
    const session = await auth();
    
    if (!session?.user) {
      console.log('[KNOWLEDGEUPLOAD] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`[KNOWLEDGEUPLOAD] Authenticated user: ${userId}`);
    
    // Parse form data
    const formData = await req.formData();
    console.log('[KNOWLEDGEUPLOAD] Successfully parsed form data');
    
    // Get essential fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const sourceType = formData.get('sourceType') as string;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!sourceType) {
      return NextResponse.json({ error: 'Source type is required' }, { status: 400 });
    }
    
    console.log(`[KNOWLEDGEUPLOAD] Creating document: ${title}, type: ${sourceType}`);
    
    // Handle different source types and set accurate file sizes
    let fileSize = 'unknown';
    let fileType = 'text/plain';
    
    if (sourceType === 'text') {
      const content = formData.get('content') as string || '';
      fileSize = `${content.length} chars`;
      fileType = 'text/plain';
    } else if (sourceType === 'url') {
      const sourceUrl = formData.get('sourceUrl') as string || '';
      const notes = formData.get('notes') as string || '';
      // Size is based on URL + notes + estimate for web content
      const urlSize = sourceUrl.length + notes.length + 1000;
      fileSize = `${urlSize} chars`;
      fileType = 'text/html';
    } else if (sourceType === 'audio') {
      const audioFile = formData.get('file') as File;
      const audioBlob = formData.get('audioBlob') as Blob;
      // For audio, estimate based on file size or recording length
      if (audioFile) {
        // Roughly estimate 1KB = 500 characters of transcribed text
        const estimatedChars = Math.round((audioFile.size / 1024) * 500);
        fileSize = `${estimatedChars} chars`;
      } else if (audioBlob) {
        const estimatedChars = Math.round((audioBlob.size / 1024) * 500);
        fileSize = `${estimatedChars} chars`;
      } else {
        fileSize = '2000 chars'; // Fallback
      }
      fileType = 'audio/webm';
    }
    
    // Create a document in the database
    const document = await createKnowledgeDocument({
      userId,
      title,
      description,
      sourceType,
      sourceUrl: formData.get('sourceUrl') as string || '',
      fileSize,
      fileType,
    });
    
    console.log(`[KNOWLEDGEUPLOAD] Document created with ID: ${document.id}`);

    // Handle text content - create basic chunks
    if (sourceType === 'text') {
      const content = formData.get('content') as string;
      if (content) {
        console.log(`[KNOWLEDGEUPLOAD] Processing text content (${content.length} chars)`);
        
        // Simple chunking - split by paragraphs or fixed size if too large
        const chunks = splitTextIntoChunks(content);
        console.log(`[KNOWLEDGEUPLOAD] Created ${chunks.length} chunks`);
        
        // Store chunks in database
        for (let i = 0; i < chunks.length; i++) {
          await createKnowledgeChunk({
            documentId: document.id,
            content: chunks[i],
            metadata: { index: i },
            chunkIndex: i.toString(),
            embedding: [], // Empty embedding for simplified version
          });
          console.log(`[KNOWLEDGEUPLOAD] Stored chunk ${i+1}/${chunks.length}`);
        }

        // Mark document as completed
        await updateKnowledgeDocument({
          id: document.id,
          status: 'completed',
        });
        console.log(`[KNOWLEDGEUPLOAD] Document marked as completed`);
      }
    } else if (sourceType === 'url') {
      // For now, just mark URL documents as completed (skipping actual fetching)
      await updateKnowledgeDocument({
        id: document.id,
        status: 'completed',
      });
      console.log(`[KNOWLEDGEUPLOAD] URL document marked as completed (simplified processing)`);
    }
    
    return NextResponse.json({
      success: true,
      id: document.id,
      title: document.title,
      status: document.status,
      message: 'Document created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('[KNOWLEDGEUPLOAD] Error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Import database update function
import { updateKnowledgeDocument } from '@/lib/db/queries';

/**
 * Split text into chunks of approximately 800-1000 tokens (simplified version)
 */
function splitTextIntoChunks(text: string): string[] {
  // A simple implementation that splits by paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // Rough estimate: 1 token ≈ 4 characters
    if (currentChunk.length + paragraph.length > 3500) { // ~875 tokens
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If no paragraphs found or text is very short, just return the whole text
  if (chunks.length === 0) {
    return [text];
  }

  return chunks;
}