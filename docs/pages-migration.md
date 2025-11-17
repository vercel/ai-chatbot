# Pages System Migration Plan

## Summary

The legacy **Views** experience has been reimplemented as the **Pages** system for the Next.js codebase. Pages are stored in the new `public.pages` table and rendered through the dynamic builder available at `/app/pages/[pageId]`. Legacy `/app/views` routes now redirect to the new paths.

## Rollout Steps

1. **Database preparation**
   - Apply Supabase migration `20251113010000_pages_system.sql` to create `public.pages`.
   - If an existing `public.views` table is present, backfill data with:
     ```sql
     insert into public.pages (id, workspace_id, name, description, layout, blocks, settings, created_by, created_at, updated_at)
     select id,
            coalesce(workspace_id, gen_random_uuid()),
            name,
            description,
            coalesce(layout, '{}'::jsonb),
            coalesce(blocks, '[]'::jsonb),
            coalesce(settings, '{}'::jsonb),
            created_by,
            created_at,
            updated_at
     from public.views
     on conflict (id) do nothing;
     ```
   - Drop or archive `public.views` after verifying parity.

2. **Feature flag & coexistence**
   - Keep the builder behind the existing workspace RBAC. `pages.view` grants read access; `pages.edit` grants edit/create capabilities.
   - Legacy `/app/views` requests are redirected to `/app/pages` so bookmarks continue to work.

3. **API alignment**
   - Clients should use `/api/pages`, `/api/pages/[id]`, and `/api/pages/[id]/save`.
   - Block data loads through `/api/supabase/table` and `/api/supabase/record`, which honour workspace context and permissions.

4. **Cleanup**
   - Remove unused Svelte modules after confirming no consumers remain.
   - Update runbooks, product docs, and onboarding material to reference “Pages” instead of “Views”.

## Testing Checklist

### Unit
- [`lib/server/pages/repository`](../lib/server/pages/repository.ts): parsing, create/update flows, error surfaces.
- [`components/pages/transformers`](../components/pages/transformers.ts): draft ↔ persisted conversions, filter serialization.
- [`lib/server/tenant/permissions`](../lib/server/tenant/permissions.ts): capability checks for typical role combinations.

### Integration
- `/api/pages` (GET/POST) happy-path and permission failures.
- `/api/pages/[id]` (GET) with view-only users.
- `/api/pages/[id]/save` (PUT/POST) requires `pages.edit` and rejects unknown ids.
- `/api/supabase/table` and `/api/supabase/record` cover supported filter operators and error responses.

### E2E / Smoke
- Navigate to `/app/pages` and load an existing page in read mode.
- Toggle edit mode, modify a block, and save; ensure subsequent reload reflects changes.
- Validate URL-parameter driven filters by loading `/app/pages/[id]?customerId=...` and confirming the list block filters.
- Hit a legacy URL `/app/views/[id]` and confirm redirect + correct rendering.

