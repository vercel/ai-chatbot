# Knowledge Base Simplification

This document explains the simplification made to the knowledge base upload process to focus solely on text content.

## Overview

The knowledge base addition process has been simplified to only require two fields:
1. **Title**: Name of the knowledge document
2. **Content**: Raw text content to be processed

## Changes Made

### 1. Knowledge Upload Component
- Removed all source type options (PDF, URL, audio, video, etc.)
- Removed file upload functionality
- Kept only Title and Content fields
- Simplified form validation and submission logic

### 2. Backend API
- Modified `/api/knowledge` to only accept text content
- Added validation to reject non-text source types
- Simplified document processing flow

### 3. Document Processor
- Removed all code related to handling different file types
- Simplified text extraction logic to only work with directly provided text content
- Removed PDF handling code
- Kept embedding and chunking logic unchanged

### 4. Clean-up
- Removed unused PDF extractor components
- Removed unnecessary file handling code
- Fixed references to removed variables

## Why This Change?

This simplification provides several advantages:
1. **Reliability**: Removes complex file processing that was causing issues
2. **Simplicity**: Makes the knowledge base addition process straightforward
3. **Performance**: Reduces the number of steps involved in processing
4. **Maintainability**: Reduces the code complexity and potential points of failure

## Usage

The process for adding content to the knowledge base is now:
1. Click "Add Document" in the Knowledge Base
2. Enter a Title
3. Paste the text content
4. Click "Add Document"

The system will process the text, split it into chunks, create embeddings, and store it in the database, making it available for the AI to reference during chats.
