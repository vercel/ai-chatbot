-- Script to remove audio records from the knowledge database

-- First, delete chunks associated with audio documents
DELETE FROM "KnowledgeChunk"
WHERE "documentId" IN (
  SELECT id FROM "KnowledgeDocument"
  WHERE "sourceType" = 'audio'
);

-- Then, delete the audio documents themselves
DELETE FROM "KnowledgeDocument"
WHERE "sourceType" = 'audio';
