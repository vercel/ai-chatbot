import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { generateText } from 'ai';
import { myProvider } from './providers';
import { anthropic } from '@ai-sdk/anthropic';
import { customProvider } from 'ai';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

interface ParseResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    fileType?: string;
  };
}

// Claude provider for fallback
const claudeProvider = customProvider({
  languageModels: {
    'claude-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  },
});

async function parseTextFile(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(buffer);
    return {
      success: true,
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        fileType: 'text',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function parseJSONFile(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const decoder = new TextDecoder('utf-8');
    const jsonText = decoder.decode(buffer);
    const jsonObj = JSON.parse(jsonText);
    const content = JSON.stringify(jsonObj, null, 2);
    return {
      success: true,
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        fileType: 'json',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function parsePDFFile(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParseResult> {
  console.log(`🔄 Parsing PDF with LangChain: ${fileName}`);

  // Create temporary file for LangChain PDFLoader
  const tempFilePath = join(tmpdir(), `temp_${Date.now()}_${fileName}`);

  try {
    // Write buffer to temporary file
    const uint8Array = new Uint8Array(buffer);
    writeFileSync(tempFilePath, uint8Array);
    console.log(`📁 Created temp file: ${tempFilePath}`);

    // Use LangChain PDFLoader to extract text
    const loader = new PDFLoader(tempFilePath, {
      splitPages: false, // Get all pages as one document
    });

    const docs = await loader.load();
    console.log(`✅ LangChain extracted ${docs.length} documents`);

    if (docs.length === 0) {
      return {
        success: false,
        error: 'No content extracted from PDF',
      };
    }

    const content = docs.map((doc) => doc.pageContent).join('\n\n');
    const totalPages = docs[0]?.metadata?.pdf?.totalPages || docs.length;

    console.log(
      `✅ PDF parsed successfully. Content length: ${content.length} characters, Pages: ${totalPages}`,
    );

    return {
      success: true,
      content,
      metadata: {
        pages: totalPages,
        wordCount: content.split(/\s+/).length,
        fileType: 'pdf',
      },
    };
  } catch (error) {
    console.error('❌ LangChain PDF parsing failed:', error);
    return {
      success: false,
      error: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFilePath);
      console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
    }
  }
}

async function parseCSVFile(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParseResult> {
  console.log(`🔄 Parsing CSV with LangChain: ${fileName}`);

  // Create temporary file for LangChain CSVLoader
  const tempFilePath = join(tmpdir(), `temp_${Date.now()}_${fileName}`);

  try {
    // Write buffer to temporary file
    const uint8Array = new Uint8Array(buffer);
    writeFileSync(tempFilePath, uint8Array);

    // Use LangChain CSVLoader to extract content
    const loader = new CSVLoader(tempFilePath);
    const docs = await loader.load();

    if (docs.length === 0) {
      return {
        success: false,
        error: 'No content extracted from CSV',
      };
    }

    const content = `CSV File with ${docs.length} rows:\n\n${docs.map((doc) => doc.pageContent).join('\n')}`;

    console.log(`✅ CSV parsed successfully. ${docs.length} rows extracted`);

    return {
      success: true,
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        fileType: 'csv',
      },
    };
  } catch (error) {
    console.error('❌ LangChain CSV parsing failed:', error);
    return {
      success: false,
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
  }
}

async function parseDocxFile(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParseResult> {
  console.log(`🔄 Parsing DOCX with LangChain: ${fileName}`);

  // Create temporary file for LangChain DocxLoader
  const tempFilePath = join(tmpdir(), `temp_${Date.now()}_${fileName}`);

  try {
    // Write buffer to temporary file
    const uint8Array = new Uint8Array(buffer);
    writeFileSync(tempFilePath, uint8Array);

    // Use LangChain DocxLoader to extract content
    const loader = new DocxLoader(tempFilePath);
    const docs = await loader.load();

    if (docs.length === 0) {
      return {
        success: false,
        error: 'No content extracted from DOCX',
      };
    }

    const content = docs.map((doc) => doc.pageContent).join('\n\n');

    console.log(
      `✅ DOCX parsed successfully. Content length: ${content.length} characters`,
    );

    return {
      success: true,
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        fileType: 'docx',
      },
    };
  } catch (error) {
    console.error('❌ LangChain DOCX parsing failed:', error);
    return {
      success: false,
      error: `Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
  }
}

async function parseImageWithAI(
  buffer: ArrayBuffer,
  mimeType: string,
  useClaudeFallback = false,
): Promise<ParseResult> {
  try {
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const provider = useClaudeFallback ? claudeProvider : myProvider;
    const model = useClaudeFallback ? 'claude-sonnet' : 'chat-model';

    const { text } = await generateText({
      model: provider.languageModel(model),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract and describe all text content visible in this image. Include any text, labels, captions, or readable content. Be thorough and accurate.',
            },
            {
              type: 'image',
              image: dataUrl,
            },
          ],
        },
      ],
    });

    return {
      success: true,
      content: text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        fileType: 'image',
      },
    };
  } catch (error) {
    if (!useClaudeFallback) {
      // Try with Claude as fallback
      return parseImageWithAI(buffer, mimeType, true);
    }

    return {
      success: false,
      error: `Failed to parse image with AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function parseFile(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType?: string,
): Promise<ParseResult> {
  console.log(
    `🔄 Starting LangChain-based parsing: ${fileName}, type: ${mimeType}, size: ${buffer.byteLength} bytes`,
  );
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  try {
    // Route to appropriate parser based on file type
    switch (fileExtension) {
      case 'txt':
      case 'md':
      case 'markdown':
      case 'html':
      case 'xml':
      case 'rtf':
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'css':
      case 'scss':
      case 'less':
      case 'php':
      case 'rb':
      case 'go':
      case 'rs':
      case 'swift':
      case 'kt':
      case 'sql':
        return await parseTextFile(buffer);

      case 'json':
        return await parseJSONFile(buffer);

      case 'csv':
        return await parseCSVFile(buffer, fileName);

      case 'pdf':
        return await parsePDFFile(buffer, fileName);

      case 'docx':
        return await parseDocxFile(buffer, fileName);

      case 'doc': {
        // For .doc files, try DOCX loader first, then fallback to text
        try {
          return await parseDocxFile(buffer, fileName);
        } catch {
          const textResult = await parseTextFile(buffer);
          if (
            textResult.success &&
            textResult.content &&
            textResult.content.length > 50
          ) {
            return textResult;
          }
          return {
            success: false,
            error:
              'DOC file format not fully supported. Please convert to DOCX for better parsing.',
          };
        }
      }

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'tiff':
      case 'tif':
      case 'svg':
        if (mimeType?.startsWith('image/')) {
          return await parseImageWithAI(buffer, mimeType);
        }
        return {
          success: false,
          error: 'Image parsing requires valid MIME type',
        };

      case 'pptx':
      case 'ppt':
      case 'xlsx':
      case 'xls':
      case 'zip':
      case 'rar':
      case '7z':
        // These formats are complex and would need special parsers
        return {
          success: false,
          error: `${fileExtension.toUpperCase()} files are uploaded but cannot be parsed for content. File is still available as an attachment.`,
        };

      default: {
        // Try parsing as text for unknown file types
        const unknownTextResult = await parseTextFile(buffer);
        if (
          unknownTextResult.success &&
          unknownTextResult.content &&
          unknownTextResult.content.length > 20
        ) {
          return {
            ...unknownTextResult,
            metadata: {
              ...unknownTextResult.metadata,
              fileType: 'unknown',
            },
          };
        }

        return {
          success: false,
          error: `File type ${fileExtension} uploaded successfully but content parsing not supported. File is available as an attachment.`,
        };
      }
    }
  } catch (error) {
    console.error('❌ File parsing failed:', error);
    return {
      success: false,
      error: `File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function getSupportedFileTypes(): string[] {
  return [
    // Text formats
    'txt',
    'md',
    'markdown',
    'json',
    'csv',
    'xml',
    'html',
    'rtf',
    // Document formats
    'pdf',
    'docx',
    'doc',
    'pptx',
    'ppt',
    'xlsx',
    'xls',
    // Image formats
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'bmp',
    'tiff',
    'tif',
    'svg',
    // Archive formats
    'zip',
    'rar',
    '7z',
    // Code formats
    'js',
    'ts',
    'py',
    'java',
    'cpp',
    'c',
    'css',
    'scss',
    'less',
    'php',
    'rb',
    'go',
    'rs',
    'swift',
    'kt',
    'sql',
  ];
}

export function isSupportedFileType(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? getSupportedFileTypes().includes(extension) : false;
}
