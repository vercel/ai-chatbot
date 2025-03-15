# PDF Processing Implementation

This document explains how PDF text extraction has been implemented in the knowledge base system.

## Installation

To enable PDF text extraction, you need to install the `pdf-parse` library. Due to dependency conflicts with React 19, use the following command:

```bash
npm run install-pdf-parse
# or directly
npm install pdf-parse --legacy-peer-deps
```

After installation, restart the server to activate PDF processing.

## Overview

The system now supports uploading PDF files, extracting text from them, and processing the text in the same way as other text-based sources (chunking, embedding, etc.).

## Implementation Details

### 1. Dependencies

The implementation uses the `pdf-parse` library for extracting text from PDF files. This has been added to the project dependencies:

```json
"pdf-parse": "^1.1.1"
```

### 2. PDF Text Extraction

When a PDF file is uploaded:

1. The file is saved to the local file system using the existing `saveUploadedFile` function
2. The `extractTextFromPdf` function is called to extract text from the PDF using the `pdf-parse` library
3. The extracted text is then processed just like any other text-based source (chunking, embedding, etc.)

The `extractTextFromPdf` function takes a file path and returns the extracted text:

```typescript
async function extractTextFromPdf(filePath: string): Promise<string> {
  // Read the PDF file
  const dataBuffer = fs.readFileSync(filePath);
  
  // Parse the PDF and extract text
  const data = await pdfParse(dataBuffer);
  
  // Return the extracted text
  return data.text;
}
```

### 3. API Integration

The API route `/api/knowledge/process` has been updated to handle PDF processing on the server side. This allows the frontend to send a PDF file and receive the extracted text.

## Usage

From a user perspective, the process is the same as before:

1. Click "Add Document" in the Knowledge Base
2. Select "PDF" as the source type
3. Upload a PDF file
4. The system will extract text from the PDF and process it

## Graceful Degradation

The implementation includes fallback mechanisms to ensure the system remains functional even if pdf-parse is not installed:

1. If pdf-parse is not available in the document processor, it attempts to call the API route
2. If that fails, it falls back to a placeholder text with instructions
3. The API route provides helpful error messages with installation instructions

## Limitations

The current implementation has a few limitations:

1. PDF parsing relies on the capabilities of the `pdf-parse` library, which may not handle all PDF formats perfectly
2. Very large PDFs may cause performance issues
3. The extraction does not preserve formatting or structure beyond basic text extraction
4. Dependency conflicts with React 19 require using the `--legacy-peer-deps` flag

## Future Improvements

Potential future improvements:

1. Better handling of PDF structure (headings, sections, etc.)
2. Integration with more advanced PDF processing services
3. Support for password-protected PDFs
4. Preview of extracted content before processing
