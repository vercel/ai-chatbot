ALTER TABLE "User"
ADD COLUMN "role" varchar NOT NULL DEFAULT 'member';

-- Optional: backfill existing rows explicitly (in case default doesn't apply to existing rows)
UPDATE "User" SET "role" = 'member' WHERE "role" IS NULL;


