ALTER TABLE "accounts" DROP CONSTRAINT "accounts_provider_providerAccountId";
ALTER TABLE "verificationToken" DROP CONSTRAINT "verificationToken_identifier_token";
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "accounts" ("provider","providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "sessions" ("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "verificationToken" ("identifier","token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "verificationToken" ("token");