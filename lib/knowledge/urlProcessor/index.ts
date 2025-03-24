import { createKnowledgeChunk, updateKnowledgeDocument } from '@/lib/db/queries';
import { OpenAI } from 'openai';
import { splitTextIntoChunks, createEmbeddingWithAPI } from '@/lib/knowledge/localFiles/documentProcessor';
import { saveProcessedContent, getEmbedding, saveEmbedding } from '@/lib/knowledge/localFiles/fileHandler';
import firecrawlClient from '@/lib/knowledge/firecrawl/client';

// Create OpenAI client
const openai = new OpenAI();

// Helper function to strip HTML tags and normalize whitespace
function stripHtml(html: string): string {
  // Replace all HTML tags with spaces
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Replace HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

interface FetchWebContentParams {
  documentId: string;
  url: string;
  userId: string;
}

/**
 * Extract content directly from a URL
 */
async function extractContentDirectly(url: string): Promise<{ title: string, content: string }> {
  console.log(`[URL PROCESSOR] Direct extraction from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch content from URL: ${response.status}`);
  }

  const htmlContent = await response.text();
  
  // Basic HTML extraction (enhanced approach)
  // Extract title
  let title = '';
  const titleMatch = htmlContent.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }
  
  // Try to get content from meta description
  let metaDescription = '';
  const metaDescMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i) || 
                       htmlContent.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["'][^>]*>/i);
  if (metaDescMatch && metaDescMatch[1]) {
    metaDescription = metaDescMatch[1].trim();
  }
  
  // Extract main content (hierarchical approach)
  let content = '';
  
  // 1. Try article tags first
  const articleMatch = htmlContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1]) {
    content = stripHtml(articleMatch[1]);
  } 
  // 2. Try main tag
  else {
    const mainMatch = htmlContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch && mainMatch[1]) {
      content = stripHtml(mainMatch[1]);
    } 
    // 3. Try content div with common ID/class patterns
    else {
      const contentDivMatch = htmlContent.match(/(<div[^>]*(?:id|class)=["'][^"']*(?:content|main|article)[^"']*["'][^>]*>[\s\S]*?<\/div>)/i);
      if (contentDivMatch && contentDivMatch[1]) {
        content = stripHtml(contentDivMatch[1]);
      } 
      // 4. Fall back to body content with cleaning
      else {
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
          // Remove scripts, styles, navs, headers, footers and other non-content elements
          let bodyContent = bodyMatch[1];
          bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');
          bodyContent = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, '');
          bodyContent = bodyContent.replace(/<nav[\s\S]*?<\/nav>/gi, '');
          bodyContent = bodyContent.replace(/<header[\s\S]*?<\/header>/gi, '');
          bodyContent = bodyContent.replace(/<footer[\s\S]*?<\/footer>/gi, '');
          bodyContent = bodyContent.replace(/<aside[\s\S]*?<\/aside>/gi, '');
          bodyContent = bodyContent.replace(/<form[\s\S]*?<\/form>/gi, '');
          
          content = stripHtml(bodyContent);
        }
      }
    }
  }
  
  // Check if content is too short, add meta description
  if (content.length < 200 && metaDescription) {
    if (content) {
      content = content + '\n\n' + metaDescription;
    } else {
      content = metaDescription;
    }
  }

  // If still no good content, try extracting all paragraphs
  if (content.length < 200) {
    const paragraphs: string[] = [];
    const pMatches = htmlContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    
    for (const match of pMatches) {
      if (match[1]) {
        const pContent = stripHtml(match[1]).trim();
        if (pContent.length > 20) { // Only include meaningful paragraphs
          paragraphs.push(pContent);
        }
      }
    }
    
    // If we found paragraphs, use them
    if (paragraphs.length > 0) {
      content = paragraphs.join('\n\n');
    }
  }
  
  // Truncate if extremely long
  const maxContentLength = 10000;
  if (content.length > maxContentLength) {
    content = content.substring(0, maxContentLength) + '...';
  }

  return { title, content };
}

/**
 * Fetches web content from a URL and processes it
 */
export async function fetchWebContent({
  documentId,
  url,
  userId,
}: FetchWebContentParams) {
  console.log(`\n[URL PROCESSOR] Starting processing of URL: "${url}" (${documentId})`);
  
  try {
    let data = { title: '', content: '' };
    
    // Try Firecrawl API first if we have an API key
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (apiKey) {
      try {
        console.log(`[URL PROCESSOR] Attempting to fetch content via Firecrawl API`);
        const result = await firecrawlClient.scrapeUrl(url);
        
        // Check if we got meaningful content
        if (result.content && result.content.length > 100) {
          console.log(`[URL PROCESSOR] Successfully fetched content using Firecrawl API`);
          data.title = result.title || '';
          data.content = result.content;
        } else {
          throw new Error('Insufficient content from Firecrawl API');
        }
      } catch (firecrawlError) {
        console.warn(`[URL PROCESSOR] Firecrawl API error: ${firecrawlError.message}`);
        console.log(`[URL PROCESSOR] Falling back to direct content extraction`);
        
        // Use direct extraction as fallback
        data = await extractContentDirectly(url);
      }
    } else {
      console.log(`[URL PROCESSOR] No Firecrawl API key found, using direct extraction`);
      data = await extractContentDirectly(url);
    }

    // Check if we have content
    if (!data.content) {
      throw new Error('No content extracted from the URL');
    }

    // Construct a nice formatted content with title, URL and content
    let extractedText = '';
    if (data.title) {
      extractedText += `# ${data.title}\n\n`;
    }
    extractedText += `Source: ${url}\n\n`;
    extractedText += data.content;

    console.log(`[URL PROCESSOR] Successfully extracted ${extractedText.length} characters from URL`);
    
    // Split text into chunks
    console.log(`[URL PROCESSOR] Splitting text into chunks...`);
    const chunks = splitTextIntoChunks(extractedText);
    console.log(`[URL PROCESSOR] Created ${chunks.length} chunks`);
    
    // Process chunks and create embeddings
    const processedChunks = [];
    
    console.log(`[URL PROCESSOR] Processing chunks and creating embeddings...`);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[URL PROCESSOR] Processing chunk ${i+1}/${chunks.length} (${chunk.length} chars)`);
      
      // Check if we already have an embedding for this chunk
      let embedding = getEmbedding(chunk);
      let embeddingSource = 'cache';
      
      // If not, generate a new embedding
      if (!embedding) {
        console.log(`[URL PROCESSOR] No cached embedding found, generating new one`);
        embedding = await createEmbeddingWithAPI(chunk);
        embeddingSource = 'new';
        
        // Save the embedding for future use
        saveEmbedding(chunk, embedding);
      } else {
        console.log(`[URL PROCESSOR] Using cached embedding`);
      }
      
      // Store chunk and embedding in database
      const chunkData = await createKnowledgeChunk({
        documentId: documentId,
        content: chunk,
        metadata: {
          index: i,
          sourceUrl: url,
          embeddingSource,
        },
        chunkIndex: i.toString(),
        embedding: embedding,
      });
      
      console.log(`[URL PROCESSOR] Stored chunk ${i+1} in database`);
      
      processedChunks.push({
        id: chunkData.id,
        index: i,
        contentPreview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''),
        contentLength: chunk.length,
        embeddingSource,
      });
    }
    
    // Save processed data
    const processedData = {
      documentId: documentId,
      url: url,
      extractedTextLength: extractedText.length,
      chunkCount: chunks.length,
      processedAt: new Date().toISOString(),
      chunks: processedChunks,
    };
    
    saveProcessedContent(userId, documentId, processedData);
    console.log(`[URL PROCESSOR] Saved processed data to local storage`);

    // Update document status to completed
    await updateKnowledgeDocument({
      id: documentId,
      status: 'completed',
    });
    console.log(`[URL PROCESSOR] URL processing completed successfully`);

    return { success: true, data: processedData };
  } catch (error) {
    console.error('[URL PROCESSOR] Error processing URL:', error);
    
    // Update document status to failed
    await updateKnowledgeDocument({
      id: documentId,
      status: 'failed',
      processingError: error instanceof Error ? error.message : 'Unknown error',
    });

    console.log(`[URL PROCESSOR] Document marked as failed due to error`);
    throw error;
  }
}