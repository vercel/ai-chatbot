-- Migration to add transcriptCharCount column to KnowledgeDocument table
ALTER TABLE "KnowledgeDocument" ADD COLUMN IF NOT EXISTS "transcriptCharCount" VARCHAR(50);