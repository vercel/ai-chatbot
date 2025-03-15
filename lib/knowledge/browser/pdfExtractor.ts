/**
 * Browser-compatible PDF text extraction using PDF.js
 * This approach doesn't require installing pdf-parse and works client-side
 */

// We'll use the CDN version of PDF.js to avoid installation issues
const PDF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Define types for PDF.js
interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent(): Promise<PDFTextContent>;
}

interface PDFTextContent {
  items: PDFTextItem[];
}

interface PDFTextItem {
  str: string;
}

let pdfJsLib: any = null;

/**
 * Load PDF.js from CDN if needed
 */
export async function loadPdfJs(): Promise<void> {
  // Skip if already loaded
  if (pdfJsLib) {
    return;
  }

  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF.js loader can only be used in browser environment');
  }

  // Check if PDF.js is already loaded globally
  if ((window as any).pdfjsLib) {
    pdfJsLib = (window as any).pdfjsLib;
    console.log('[PDF Extractor] Using already loaded PDF.js');
    return;
  }

  try {
    // Create script tag to load PDF.js
    const script = document.createElement('script');
    script.src = PDF_JS_CDN;
    script.async = true;
    
    // Wait for script to load
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
      document.head.appendChild(script);
    });
    
    // Configure worker
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;
    
    // Store reference
    pdfJsLib = (window as any).pdfjsLib;
    console.log('[PDF Extractor] PDF.js loaded successfully');
  } catch (error) {
    console.error('[PDF Extractor] Error loading PDF.js:', error);
    throw error;
  }
}

/**
 * Extract text from a PDF file using PDF.js
 * @param fileOrBuffer PDF file as File object or ArrayBuffer
 * @returns Extracted text content
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  try {
    console.log('[PDF Extractor] Starting PDF text extraction');
    
    // Ensure PDF.js is loaded
    await loadPdfJs();
    
    // Convert File to ArrayBuffer if needed
    let arrayBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      arrayBuffer = fileOrBuffer;
    }
    
    // Load PDF document
    console.log('[PDF Extractor] Loading PDF document');
    const loadingTask = pdfJsLib.getDocument({ data: arrayBuffer });
    const pdf: PDFDocumentProxy = await loadingTask.promise;
    
    console.log(`[PDF Extractor] PDF loaded successfully. Document has ${pdf.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      // Get page
      const page = await pdf.getPage(i);
      
      // Get text content
      const textContent = await page.getTextContent();
      
      // Extract text
      const pageText = textContent.items.map(item => item.str).join(' ');
      
      // Add page text with page break
      fullText += pageText + '\n\n';
      
      console.log(`[PDF Extractor] Extracted text from page ${i}`);
    }
    
    console.log(`[PDF Extractor] Successfully extracted ${fullText.length} characters from PDF`);
    return fullText;
  } catch (error) {
    console.error('[PDF Extractor] Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Convert base64 string to PDF text
 * @param base64Data Base64-encoded PDF data
 * @returns Extracted text content
 */
export async function extractTextFromBase64Pdf(base64Data: string): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // Convert base64 to binary
    const binaryString = atob(base64);
    
    // Create ArrayBuffer from binary string
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Extract text from ArrayBuffer
    return await extractTextFromPdf(bytes.buffer);
  } catch (error) {
    console.error('[PDF Extractor] Error converting base64 to PDF text:', error);
    throw error;
  }
}
