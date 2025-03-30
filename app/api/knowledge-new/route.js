import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createKnowledgeDocument, createKnowledgeChunk, updateKnowledgeDocument } from '@/lib/db/queries';
import firecrawlClient from '@/lib/knowledge/firecrawl/client';
import { processAudioFile } from '@/lib/knowledge/speechmatics/audioProcessor';

// Ensure dynamic rendering and disable caching
export const dynamic = 'force-dynamic';

/**
 * Direct implementation of content fetching to avoid dependency issues
 */
async function fetchWebContent({ documentId, url, userId }) {
  console.log(`\n[DIRECT URL PROCESSOR] Processing URL: "${url}" (${documentId})`);
  
  try {
    // Try Firecrawl API first
    const apiKey = process.env.FIRECRAWL_API_KEY;
    let data = { title: '', content: '' };
    
    if (apiKey) {
      try {
        console.log(`[DIRECT URL PROCESSOR] Attempting to use Firecrawl API`);
        const result = await firecrawlClient.scrapeUrl(url);
        
        // Check if we got meaningful content
        if (result.content && result.content.length > 100) {
          console.log(`[DIRECT URL PROCESSOR] Successfully fetched content using Firecrawl API`);
          data.title = result.title || '';
          data.content = result.content;
        } else {
          throw new Error('Insufficient content from Firecrawl API');
        }
      } catch (firecrawlError) {
        console.warn(`[DIRECT URL PROCESSOR] Firecrawl API error: ${firecrawlError.message}`);
        console.log(`[DIRECT URL PROCESSOR] Falling back to direct extraction`);
        
        // Use direct extraction as fallback
        data = await extractContentDirectly(url);
      }
    } else {
      console.log(`[DIRECT URL PROCESSOR] No Firecrawl API key found, using direct extraction`);
      data = await extractContentDirectly(url);
    }

    // Check if we have content
    if (!data.content) {
      throw new Error('No content extracted from the URL');
    }

    // Format content
    let extractedText = '';
    if (data.title) {
      extractedText += `# ${data.title}\n\n`;
    }
    extractedText += `Source: ${url}\n\n`;
    extractedText += data.content;

    console.log(`[DIRECT URL PROCESSOR] Successfully extracted ${extractedText.length} characters`);
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(extractedText);
    console.log(`[DIRECT URL PROCESSOR] Created ${chunks.length} chunks`);
    
    // Store chunks in database
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await createKnowledgeChunk({
        documentId: documentId,
        content: chunk,
        metadata: {
          index: i,
          sourceUrl: url,
        },
        chunkIndex: i.toString(),
        embedding: [], // Empty embedding for simplified version
      });
      console.log(`[DIRECT URL PROCESSOR] Stored chunk ${i+1}/${chunks.length}`);
    }

    // Update document status to completed
    await updateKnowledgeDocument({
      id: documentId,
      status: 'completed',
    });
    console.log(`[DIRECT URL PROCESSOR] URL processing completed successfully`);

    return { success: true };
  } catch (error) {
    console.error('[DIRECT URL PROCESSOR] Error processing URL:', error);
    
    // Update document status to failed
    await updateKnowledgeDocument({
      id: documentId,
      status: 'failed',
      processingError: error instanceof Error ? error.message : 'Unknown error',
    });

    console.log(`[DIRECT URL PROCESSOR] Document marked as failed due to error`);
    throw error;
  }
}

/**
 * Helper function to extract content directly from a URL
 */
async function extractContentDirectly(url) {
  console.log(`[DIRECT URL PROCESSOR] Direct extraction from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch content from URL: ${response.status}`);
  }

  const htmlContent = await response.text();
  
  // Extract title
  let title = '';
  const titleMatch = htmlContent.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }
  
  // Try to get content
  let content = '';
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    // Remove scripts, styles, etc.
    let bodyContent = bodyMatch[1];
    bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');
    bodyContent = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // Strip HTML tags and normalize whitespace
    content = stripHtml(bodyContent);
  }

  return { title, content };
}

/**
 * Helper function to strip HTML tags and normalize whitespace
 */
function stripHtml(html) {
  // Replace HTML tags with spaces
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Replace HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Split text into chunks
 */
function splitTextIntoChunks(text) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > 3500) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length ? chunks : [text];
}

/**
 * API endpoint for handling knowledge document uploads
 * Now supports audio files using Speechmatics API for transcription
 */
export async function POST(req) {
  console.log('[KNOWLEDGE-NEW] POST request received');
  
  try {
    // Get user session
    const session = await auth();
    
    if (!session?.user) {
      console.log('[KNOWLEDGE-NEW] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`[KNOWLEDGE-NEW] Authenticated user: ${userId}`);
    
    // Parse form data
    const formData = await req.formData();
    console.log('[KNOWLEDGE-NEW] Successfully parsed form data');
    
    // Get essential fields
    let title = formData.get('title');
    const description = formData.get('description') || '';
    const sourceType = formData.get('sourceType');
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!sourceType) {
      return NextResponse.json({ error: 'Source type is required' }, { status: 400 });
    }
    
    // Fix for URL validation
    let sourceUrl = '';
    if (sourceType === 'url') {
      sourceUrl = formData.get('sourceUrl') || '';
      // Add protocol if missing
      if (sourceUrl && !sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
        sourceUrl = 'https://' + sourceUrl;
        formData.set('sourceUrl', sourceUrl);
        console.log(`[KNOWLEDGE-NEW] Fixed URL to: ${sourceUrl}`);
      }
    }
    
    console.log(`[KNOWLEDGE-NEW] Creating document: ${title}, type: ${sourceType}`);
    
    // Handle different source types and set accurate file sizes
    let fileSize = 'unknown';
    let fileType = 'text/plain';
    
    if (sourceType === 'text') {
      const content = formData.get('content') || '';
      fileSize = `${content.length} chars`;
      fileType = 'text/plain';
    } else if (sourceType === 'url') {
      // Use the validated sourceUrl
      const notes = formData.get('notes') || '';
      const urlSize = sourceUrl.length + notes.length + 1000;
      fileSize = `${urlSize} chars`;
      fileType = 'text/html';
    } else if (sourceType === 'audio') {
      const audioFile = formData.get('file');
      const audioBlob = formData.get('audioBlob');
      if (audioFile) {
        const estimatedChars = Math.round((audioFile.size / 1024) * 500);
        fileSize = `${estimatedChars} chars`;
        fileType = audioFile.type || 'audio/webm';
      } else if (audioBlob) {
        const estimatedChars = Math.round((audioBlob.size / 1024) * 500);
        fileSize = `${estimatedChars} chars`;
        fileType = 'audio/webm';
      } else {
        fileSize = '2000 chars';
        fileType = 'audio/webm';
      }
    }
    
    // Create a document in the database
    const document = await createKnowledgeDocument({
      userId,
      title,
      description,
      sourceType,
      sourceUrl: sourceUrl || '',
      fileSize,
      fileType,
    });
    
    console.log(`[KNOWLEDGE-NEW] Document created with ID: ${document.id}`);

    // Handle text content - create basic chunks
    if (sourceType === 'text') {
      const content = formData.get('content');
      if (content) {
        console.log(`[KNOWLEDGE-NEW] Processing text content (${content.length} chars)`);
        
        // Simple chunking - split by paragraphs or fixed size if too large
        const chunks = splitTextIntoChunks(content);
        console.log(`[KNOWLEDGE-NEW] Created ${chunks.length} chunks`);
        
        // Store chunks in database
        for (let i = 0; i < chunks.length; i++) {
          await createKnowledgeChunk({
            documentId: document.id,
            content: chunks[i],
            metadata: { index: i },
            chunkIndex: i.toString(),
            embedding: [], // Empty embedding for simplified version
          });
          console.log(`[KNOWLEDGE-NEW] Stored chunk ${i+1}/${chunks.length}`);
        }

        // Mark document as completed
        await updateKnowledgeDocument({
          id: document.id,
          status: 'completed',
        });
        console.log(`[KNOWLEDGE-NEW] Document marked as completed`);
      }
    } else if (sourceType === 'url') {
      const sourceUrl = formData.get('sourceUrl');
      if (!sourceUrl) {
        console.log(`[KNOWLEDGE-NEW] Missing URL`);
        throw new Error('URL is required');
      }
      console.log(`[KNOWLEDGE-NEW] Starting URL processing for ${sourceUrl}...`);
      
      // Process URL in the background without waiting for completion
      fetchWebContent({
        documentId: document.id,
        url: sourceUrl,
        userId: userId
      }).catch(processingError => {
        console.error(`[KNOWLEDGE-NEW] Background URL processing error:`, processingError);
      });
      
      console.log(`[KNOWLEDGE-NEW] URL processing started in the background`);
    } else if (sourceType === 'audio') {
      const audioFile = formData.get('file');
      const language = formData.get('language') || 'en'; // Get the selected language
      if (audioFile) {
        // Process audio file in the background
        console.log(`[KNOWLEDGE-NEW] Starting audio processing for ${audioFile.name}... (Language: ${language})`);
        
        processAudioFile({
          documentId: document.id,
          audioFile,
          userId,
          language // Pass the language to the processor
        }).catch(processingError => {
          console.error(`[KNOWLEDGE-NEW] Background audio processing error:`, processingError);
        });
        
        console.log(`[KNOWLEDGE-NEW] Audio processing started in the background`);
      } else {
        console.log(`[KNOWLEDGE-NEW] Missing audio file`);
        throw new Error('Audio file is required');
      }
    }
    
    return NextResponse.json({
      success: true,
      id: document.id,
      title: document.title,
      status: document.status,
      message: 'Document created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('[KNOWLEDGE-NEW] Error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}