# Client-Side PDF Processing

This document explains the implementation of client-side PDF text extraction in the knowledge base system, avoiding dependency issues with server-side libraries.

## Overview

Instead of using server-side PDF processing with the `pdf-parse` library (which has dependency conflicts with React 19), we've implemented a client-side solution using Mozilla's PDF.js. This approach:

1. Works entirely in the browser
2. Doesn't require installing additional npm packages
3. Avoids dependency conflicts
4. Provides a better user experience with immediate feedback

## Implementation Details

### 1. PDF.js Integration

We use PDF.js loaded from a CDN to extract text from PDF files:

```typescript
// Load PDF.js from CDN
const PDF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
```

### 2. Components Created

1. **PDF Extractor Library** (`lib/knowledge/browser/pdfExtractor.ts`)
   - Provides functions to load PDF.js and extract text from PDFs
   - Works with File objects or ArrayBuffers

2. **PDF Text Extractor Component** (`components/pdf-text-extractor.tsx`)
   - React component that handles the PDF extraction UI
   - Shows loading state, progress, and extraction results
   - Allows users to review and edit extracted text

### 3. Workflow Changes

The PDF processing workflow has been updated:

1. User uploads a PDF file
2. The PDF extractor component processes the file client-side
3. Extracted text is displayed to the user for review/editing
4. The text is submitted as regular text content
5. The system processes it through the existing text pipeline

### 4. Advantages of This Approach

- **No Installation Issues**: Avoids npm dependency conflicts
- **Better User Experience**: Shows extraction progress and results
- **Simplified Backend**: Server doesn't need to handle PDF parsing
- **Reduced Server Load**: Processing happens in the user's browser
- **More Control**: Users can review and correct extracted text

## Usage

From a user perspective, the process is:

1. Click "Add Document" in the Knowledge Base
2. Select "PDF" as the source type
3. Upload a PDF file
4. Wait for text extraction (shown with loading indicators)
5. Review and optionally edit the extracted text
6. Click "Use This Text" to proceed

## Limitations

1. Very large PDFs may be slow to process in the browser
2. Some complex PDF features (especially forms or heavily formatted content) may not extract perfectly
3. PDF.js is loaded from a CDN, requiring an internet connection

## Future Improvements

1. Add support for password-protected PDFs
2. Improve text extraction accuracy for complex documents
3. Add preview of PDF pages alongside extracted text
4. Implement local caching of processed PDFs
