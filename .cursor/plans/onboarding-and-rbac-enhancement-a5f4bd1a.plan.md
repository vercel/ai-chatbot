<!-- a5f4bd1a-9063-4fad-91c0-ed66ad279be3 adb55f71-7d73-41b6-918d-50eae4902932 -->
# Onboarding and RBAC Enhancement Plan

## Overview

This plan adds comprehensive customization fields to the onboarding flow, introduces workspace-specific roles and teams for RBAC, and extends user/workspace profiles with AI personalization settings.

## Database Schema Changes

### 1. Update `users` table

Add fields to [`lib/db/schema.ts`](lib/db/schema.ts):

- `firstname` (text, nullable)
- `lastname` (text, nullable)
- `avatar_url` (text, nullable)
- `job_title` (text, nullable)
- `ai_context` (text, nullable) - free text describing role/experience
- `proficiency` (text, nullable) - text enum describing technical confidence
- `ai_tone` (text, nullable) - free text for chatbot tone preference
- `ai_guidance` (text, nullable) - free text for AI code/text generation preferences

### 2. Update `workspaces` table

Add fields to [`lib/db/schema.ts`](lib/db/schema.ts):

- `avatar_url` (text, nullable)
- `description` (text, nullable) - context for future LLM use

### 3. Create `roles` table

New table in [`lib/db/schema.ts`](lib/db/schema.ts):

- `id` (text, primary key) - slug like "admin", "dev", "staff", "user"
- `workspace_id` (uuid, foreign key to workspaces)
- `label` (text) - display name
- `description` (text, nullable)
- `level` (integer) - for permission checks like "level > 50"
- `created_at` (timestamp)
- `updated_at` (timestamp)
- Unique constraint on (workspace_id, id)

### 4. Create `teams` table

New table in [`lib/db/schema.ts`](lib/db/schema.ts):

- `id` (uuid, primary key)
- `workspace_id` (uuid, foreign key to workspaces)
- `name` (text)
- `description` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 5. Update `workspace_users` table

Modify [`lib/db/schema.ts`](lib/db/schema.ts):

- Change `role` from text to reference `roles.id` (text, foreign key to roles)
- Add `team_id` (uuid, nullable, foreign key to teams)

### 6. Create Supabase migration

Create [`supabase/migrations/20251111000300_onboarding_rbac.sql`](supabase/migrations/20251111000300_onboarding_rbac.sql):

- Add columns to users and workspaces tables
- Create roles and teams tables
- Update workspace_users table (migrate existing role text to roles table, add team_id)
- Add indexes and foreign key constraints
- Create function to seed default roles for new workspaces

## Onboarding Flow Updates

### 7. Update onboarding schema

Modify [`app/onboarding/actions.ts`](app/onboarding/actions.ts):

- Expand `onboardingSchema` to include:
- User fields: firstname, lastname, profile_pic_url, job_title, role_experience, technical_proficiency, tone_of_voice, ai_generation_guidance
- Workspace fields: workspace_name, workspace_profile_pic_url, business_description
- Update `completeOnboarding` to save all fields to both user and workspace tables

### 8. Update onboarding form UI

Modify [`components/auth/onboarding-form.tsx`](components/auth/onboarding-form.tsx):

- **Step 1 - User Profile**: firstname, lastname, job_title, role_experience (textarea), technical_proficiency (select: less/regular/more), profile_pic_url
- **Step 2 - Workspace Setup**: workspace_name, workspace_profile_pic_url, business_description (textarea)
- **Step 3 - AI Preferences**: ai_tone (textarea), ai_guidance (textarea)
- Update form state to include all new fields
- Add proper validation and field descriptions

### 9. Update onboarding page

Modify [`app/onboarding/page.tsx`](app/onboarding/page.tsx):

- Ensure workspace context is available for workspace updates
- Handle workspace creation/update during onboarding

## Roles and Teams Management

### 10. Create default roles seeding

Create [`lib/server/tenant/default-roles.ts`](lib/server/tenant/default-roles.ts):

- Function to seed default roles (admin, dev, staff, user) for a workspace
- Assign appropriate levels (e.g., admin=100, dev=60, staff=40, user=20)
- Call this when creating new workspaces

### 11. Update workspace creation

Modify [`lib/server/tenant/context.ts`](lib/server/tenant/context.ts):

- Call default roles seeding in `ensureLocalWorkspace` and workspace creation flows
- Update `workspace_users` inserts to use role IDs instead of text

### 12. Update OTP verification

Modify [`app/otp/actions.ts`](app/otp/actions.ts):

- When creating workspace membership, use default "user" role ID instead of text "admin"
- Ensure default roles are seeded before assigning membership

## Type Updates

### 13. Update TypeScript types

Update type exports in [`lib/db/schema.ts`](lib/db/schema.ts):

- Export `Role` and `Team` types
- Update `WorkspaceUser` type to reflect role/team changes

## Testing Considerations

### 14. Migration testing

- Test migration on existing data (migrate text roles to role IDs)
- Verify default roles are created for existing workspaces
- Test onboarding flow with all new fields

## Implementation Order

1. Database schema changes (steps 1-6)
2. Default roles seeding (step 10)
3. Update workspace creation/OTP flow (steps 11-12)
4. Onboarding schema and actions (step 7)
5. Onboarding UI (steps 8-9)
6. Type updates (step 13)
7. Testing and migration validation (step 14)