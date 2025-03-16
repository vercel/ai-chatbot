-- Create task_project table
CREATE TABLE IF NOT EXISTS "task_project" (
  "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "color" VARCHAR(20) NOT NULL DEFAULT '#808080',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create task_item table
CREATE TABLE IF NOT EXISTS "task_item" (
  "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "projectId" UUID NOT NULL REFERENCES "task_project"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "priority" VARCHAR(2) NOT NULL DEFAULT 'p4',
  "dueDate" TIMESTAMP,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create index on projectId for faster lookup
CREATE INDEX IF NOT EXISTS "project_id_idx" ON "task_item"("projectId");
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "task_item"("userId");

-- Create task_label table
CREATE TABLE IF NOT EXISTS "task_label" (
  "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "color" VARCHAR(20) NOT NULL DEFAULT '#808080',
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create task_item_label many-to-many relationship table
CREATE TABLE IF NOT EXISTS "task_item_label" (
  "taskId" UUID NOT NULL REFERENCES "task_item"("id") ON DELETE CASCADE,
  "labelId" UUID NOT NULL REFERENCES "task_label"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("taskId", "labelId")
);

-- Create indexes for faster lookup
CREATE INDEX IF NOT EXISTS "task_id_idx" ON "task_item_label"("taskId");
CREATE INDEX IF NOT EXISTS "label_id_idx" ON "task_item_label"("labelId");