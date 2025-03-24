import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Extract text from a PDF file using the pdf-parse library
 * 
 * @param filePath Path to the PDF file on the server
 * @returns Extracted text content
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    console.log(`[PDF EXTRACTOR] Starting PDF text extraction from: ${filePath}`);
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF
    const options = {
      // Use max pages to limit processing for large PDFs
      // max: 0, // 0 = unlimited
      
      // Include render options if needed
      // render: {
      //   normalizeWhitespace: true,
      //   disableCombineTextItems: false,
      // }
    };
    
    console.log(`[PDF EXTRACTOR] Parsing PDF file...`);
    const data = await pdf(dataBuffer, options);
    
    // Log some basic PDF info
    console.log(`[PDF EXTRACTOR] PDF info - Version: ${data.info.PDFFormatVersion}, Pages: ${data.numpages}`);
    console.log(`[PDF EXTRACTOR] Successfully extracted ${data.text.length} characters from PDF`);
    
    return data.text;
  } catch (error) {
    console.error('[PDF EXTRACTOR] Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get basic metadata about a PDF file
 * 
 * @param filePath Path to the PDF file
 * @returns Object with PDF metadata
 */
export async function getPdfMetadata(filePath: string): Promise<{ 
  pageCount: number; 
  info: any; 
  metadata: any;
  fileSize: string;
}> {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Get file size in KB or MB
    const fileSizeInBytes = dataBuffer.length;
    let fileSize: string;
    
    if (fileSizeInBytes > 1024 * 1024) {
      fileSize = `${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      fileSize = `${(fileSizeInBytes / 1024).toFixed(2)} KB`;
    }
    
    // Parse with minimal processing to get metadata
    const data = await pdf(dataBuffer, { max: 0 });
    
    return {
      pageCount: data.numpages,
      info: data.info,
      metadata: data.metadata,
      fileSize
    };
  } catch (error) {
    console.error('[PDF EXTRACTOR] Error getting PDF metadata:', error);
    throw new Error(`Failed to get PDF metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
