# Debug Instructions for Wizzo UI Components

This document provides instructions on how to debug and visualize the Extension and Task Management components that appear empty in the browser.

## Problem Overview

The Extension and Task Management pages should display various components and data, but they appear empty due to:

1. Missing or incorrect API responses
2. Database setup issues
3. Authentication problems
4. Lack of default data for new users

## Debugging Solution

We've implemented a debugging solution that uses mock data stored in localStorage to populate the components, allowing you to see and interact with them without needing to set up the backend completely.

## Instructions for Extension Page

1. Navigate to the Extension page by clicking on "Extension" in the sidebar
2. Notice that the panels appear empty with a yellow debug banner at the top
3. Open your browser's developer console (press F12 or right-click → Inspect → Console)
4. Run the following command in the console:
   ```javascript
   window.setupExtensionMockData()
   ```
5. Refresh the page - you should now see mock data in both panels:
   - The "Chrome Extension Files" panel will show unprocessed files
   - The "Offline Temp Files" panel will show files saved when offline

## Instructions for Task Management Page

1. Navigate to the Task Management page by clicking on "Tasks" in the sidebar
2. Notice that the task list appears empty with a yellow debug banner at the top
3. Open your browser's developer console (press F12 or right-click → Inspect → Console)
4. Run the following command in the console:
   ```javascript
   window.setupTaskMockData()
   ```
5. Refresh the page - you should now see mock tasks and projects:
   - The toolbar will show project filters
   - The task list will show sample tasks
   - You can interact with the tasks (mark complete, edit, delete)
   - You can add new tasks (they will only persist for the current session)

## How It Works

The debug solution works by:

1. Loading a debug helper script that adds functions to the global window object
2. When you run these functions, they create mock data and store it in the browser's localStorage
3. The components have been modified to check localStorage for mock data if the API calls fail
4. This allows you to see and interact with the UI components without needing a working backend

## Temporary Nature of This Solution

This is a temporary debugging solution to help visualize the components. The mock data:

1. Only persists in the current browser (localStorage)
2. Will be reset if you clear your browser data
3. Does not affect the actual database or backend

## Next Steps for Production

To make these components work properly in production:

1. Ensure the database tables are created correctly (run the migration scripts)
2. Debug the API routes to return proper data
3. Implement the logic to create default projects for new users
4. Add proper error handling to the components

These changes will allow the components to work with real data instead of mock data.
