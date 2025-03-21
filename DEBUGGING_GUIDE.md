# Debugging Guide for UI Components

This guide explains how to debug and fix the UI rendering issues with the Task Management and Extension tabs.

## Quick Overview of Issues

Both the Task Management and Extension tabs are currently not displaying any UI elements when navigating to their respective URLs:
- Task Management tab: http://localhost:3000/task-management
- Extension tab: http://localhost:3000/extension

## Debugging Tools Provided

I've created several debugging tools to help isolate the issue:

1. **Debug Pages**
   - `app/task-management/debug-page.tsx`
   - `app/extension/debug-page.tsx`

2. **Debug Components**
   - `components/task-management/task-debug.tsx`
   - `components/extension/extension-debug.tsx`

3. **Debugging Report Files**
   - `UI_ISSUES_REPORT.md` - Overall issues summary
   - `TASK_MANAGEMENT_DEBUG.md` - Task management specific debugging
   - `EXTENSION_DEBUG.md` - Extension tab specific debugging

## How to Use the Debug Pages

### Step 1: Enable Debug Mode

Replace the original page files with debug versions:

For Task Management:
```bash
# From the project root
mv app/task-management/page.tsx app/task-management/page.original.tsx
mv app/task-management/debug-page.tsx app/task-management/page.tsx
```

For Extension:
```bash
# From the project root
mv app/extension/page.tsx app/extension/page.original.tsx
mv app/extension/debug-page.tsx app/extension/page.tsx
```

### Step 2: Test Rendering

Navigate to the respective URLs:
- http://localhost:3000/task-management
- http://localhost:3000/extension

If you see the debug UI with red "Debug Mode Active" banner, then basic rendering is working. This means the issue is likely with:
- Data fetching/API
- Database connection
- Component dependencies
- Styling/CSS

If you still see a blank page, then there's a more fundamental issue with:
- JavaScript errors
- Missing dependencies
- React/Next.js configuration
- Route configuration

### Step 3: Check Console Errors

Open your browser developer tools (F12) and check the console for errors.

Common errors to look for:
- Failed API requests
- React rendering errors
- Missing component errors
- CSS errors

### Step 4: Database Setup for Task Management

If you've verified rendering works with the debug pages, check your database setup:

1. Verify the environment variables in `.env.local`
2. Run the database migration:
   ```bash
   npm run db:migrate
   # or
   sh run-task-migration.sh
   ```

### Step 5: Restore Original Pages

Once you've identified and fixed the issues, restore the original pages:

```bash
# For Task Management
mv app/task-management/page.original.tsx app/task-management/page.tsx

# For Extension
mv app/extension/page.original.tsx app/extension/page.tsx
```

## Common Issues and Solutions

### 1. Missing Database Tables

**Symptoms:** Task Management page is blank, console shows database-related errors

**Solution:**
- Check `.env.local` for correct database connection string
- Run database migrations: `npm run db:migrate`
- Verify tables exist in the database

### 2. API Endpoint Failures

**Symptoms:** Components load but no data appears, network tab shows failed requests

**Solution:**
- Check API routes implementation
- Verify API endpoints return expected data format
- Add error handling to API calls

### 3. CSS/Styling Issues

**Symptoms:** Page appears blank but elements exist in DOM

**Solution:**
- Check for CSS that might hide elements (display: none, visibility: hidden)
- Verify color theme variables are defined and accessible
- Test with inline styles to override potentially problematic CSS

### 4. React Component Errors

**Symptoms:** Blank page, console shows React errors

**Solution:**
- Check for missing dependencies in package.json
- Verify all required dependencies are imported correctly
- Fix any prop type mismatches

## Key Files to Check

### Task Management
- `/app/task-management/page.tsx` - Server component that fetches data
- `/components/task-management/task-management-client.tsx` - Client component
- `/lib/db/schema.ts` - Database schema definitions
- `/create-tasks-tables.sql` - SQL for creating task tables

### Extension
- `/app/extension/page.tsx` - Client component
- `/components/extension/status-panel.tsx` - Extension status panel
- `/components/extension/offline-files-panel.tsx` - Offline files panel
- `/app/api/extension/*` - API routes for extension

## Next Steps After Fixing

Once the UI is rendering properly:

1. Verify data loading and saving works correctly
2. Test all functionality (creating tasks, processing files, etc.)
3. Look for any performance issues
4. Address any UX improvements needed

## Contact

If you need further assistance, please reach out with:
- Any console errors you're seeing
- Screenshots of the UI (even if blank)
- Status of database migrations
- Any changes you've made to fix the issues
