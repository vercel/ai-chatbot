-- Simplify agent prompt structure: rename basePrompt to agentPrompt and remove customPrompt
ALTER TABLE "Agent" RENAME COLUMN "basePrompt" TO "agentPrompt";
ALTER TABLE "UserAgent" DROP COLUMN "customPrompt";
