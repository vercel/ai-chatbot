#!/usr/bin/env node

import { splitDocumentIntoChunks } from './utils.js';
import type { IndexableDocument } from './types.js';

// Test document
const testDocument: IndexableDocument = {
  sourceUri: 'test.md',
  sourceType: 'file',
  content: `# Test Document

This is a test document for demonstrating the text chunking functionality.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Section 1

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Section 2

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.

## Conclusion

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.`,
  contentHash: 'test-hash',
  metadata: {
    title: 'Test Document',
  },
};

async function testChunking() {
  try {
    console.log('🧪 Testing text chunking functionality...');
    console.log(`📄 Document length: ${testDocument.content.length} characters`);
    
    const chunks = await splitDocumentIntoChunks(testDocument);
    
    console.log(`📝 Split into ${chunks.length} chunks:`);
    
    chunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index + 1} (${chunk.content.length} chars) ---`);
      console.log(chunk.content.substring(0, 100) + '...');
    });
    
    console.log('\n✅ Text chunking test completed successfully!');
  } catch (error) {
    console.error('❌ Text chunking test failed:', error);
  }
}

testChunking(); 