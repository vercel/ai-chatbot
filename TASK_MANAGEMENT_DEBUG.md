# Task Management Feature Debug Guide

This document provides detailed debugging steps to resolve the issue where the Task Management tab appears empty instead of showing the expected UI elements.

## Expected UI Elements

The Task Management page should display:

1. A header with "Task Management" title and descriptive text
2. A toolbar with:
   - Project filter dropdown
   - Sort options dropdown
   - Filters button for showing/hiding completed tasks
   - Refresh button
   - Add Task button
3. A task list table showing tasks with:
   - Task name
   - Due date
   - Priority
   - Project
   - Completion status
   - Actions menu
4. An "Empty Tasks" placeholder when no tasks exist
5. Task dialog for adding/editing tasks

## Potential Issues and Solutions

### 1. Database Setup Issues

**Problem:** The task tables may not be properly set up in the database.

**Debugging Steps:**
1. Check if database tables exist by running a query or using database tools
2. Run the database migration script:
   ```bash
   npm run db:migrate
   ```
   or use the SQL script:
   ```bash
   sh run-task-migration.sh
   ```

**Related Files:**
- `/create-tasks-tables.sql`: Contains the SQL to create the task tables
- `/run-task-migration.sh`: Script to run the migration

### 2. Data Fetching Issues

**Problem:** The page tries to load task and project data but may be failing.

**Debugging Steps:**
1. Open browser console to check for API errors
2. Test the API endpoint directly:
   ```
   GET /api/tasks
   GET /api/tasks/projects
   ```
3. Add logging to the server-side `loadData` function in `app/task-management/page.tsx`

**Related Files:**
- `/app/task-management/page.tsx`: Server component that fetches initial data
- `/lib/db/schema.ts`: Contains the database schema definitions

### 3. Component Rendering Issues

**Problem:** The components may be mounting but not rendering properly.

**Debugging Steps:**
1. Add temporary debug elements to verify component mounting:
   ```jsx
   console.log('TaskManagementClient rendering', initialTasks, initialProjects);
   ```
2. Check if data is being passed correctly to child components
3. Verify that filtered tasks array is not empty

**Related Files:**
- `/components/task-management/task-management-client.tsx`: Main client component
- `/components/task-management/task-table.tsx`: Table component
- `/components/task-management/empty-tasks-placeholder.tsx`: Empty state component

### 4. CSS/Styling Issues

**Problem:** Elements might be present but not visible due to styling issues.

**Debugging Steps:**
1. Inspect the DOM to see if elements exist but are hidden
2. Check for any CSS that might be setting:
   - `display: none`
   - `opacity: 0`
   - `visibility: hidden`
   - `height: 0` or incorrect positioning
3. Verify that color theme variables are properly defined and accessible

**Related Files:**
- `/app/task-management/layout.tsx`: Layout that might affect styling
- `/COLOR_THEME.md`: Color theme documentation

### 5. Default Project Creation Issue

**Problem:** The code tries to create a default project if none exists, which might be failing.

**Debugging Steps:**
1. Check if the default project creation logic is working
2. Add error handling to the project creation code
3. Verify that the redirect after project creation works properly

**Code in `/app/task-management/page.tsx`:**
```typescript
// Ensure at least one project exists (create default project if none exists)
if (projects.length === 0) {
  // Create a default project
  await db.insert(taskProject).values({
    userId: session.user.id,
    name: 'Inbox',
    color: '#3B82F6', // Blue
    isDefault: true,
  });
  
  // Reload the page to get the new project
  return <meta httpEquiv="refresh" content="0" />;
}
```

## Quick Fixes to Try

1. **Add Explicit Error Handling**
   ```typescript
   try {
     const { tasks, projects } = await loadData(session.user.id);
     // Rest of the code
   } catch (error) {
     console.error('Error loading task data:', error);
     return <div>Error loading tasks: {error.message}</div>;
   }
   ```

2. **Force Client-Side Rendering for Debugging**
   Add a temporary client component wrapper to see if server-side rendering is the issue.

3. **Check Database Connection**
   Verify that the database connection is properly configured in `.env.local`.

4. **Add Console Debug**
   Add console.log statements in both server and client components to trace the execution flow.

## Testing Plan

1. First verify database setup is correct
2. Test API endpoints directly to ensure they return expected data
3. Add debug logging throughout the component hierarchy
4. Temporarily simplify the UI to isolate rendering issues
5. Check for any CSS conflicts that might be affecting visibility

