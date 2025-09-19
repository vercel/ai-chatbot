CREATE TABLE "AgentVectorStoreFile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "agentId" uuid REFERENCES "Agent"("id") ON DELETE SET NULL,
  "vectorStoreId" varchar(128) NOT NULL,
  "vectorStoreFileId" varchar(128) NOT NULL,
  "openAiFileId" varchar(128) NOT NULL,
  "fileName" text NOT NULL,
  "fileSizeBytes" bigint,
  "attributes" jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "AgentVectorStoreFile_vectorStoreFileId_unique" UNIQUE ("vectorStoreFileId")
);

CREATE INDEX "AgentVectorStoreFile_vectorStoreId_idx"
  ON "AgentVectorStoreFile" ("vectorStoreId");

CREATE INDEX "AgentVectorStoreFile_userId_idx"
  ON "AgentVectorStoreFile" ("userId");
