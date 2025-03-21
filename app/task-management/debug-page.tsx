'use client';

import React from 'react';
import { TaskDebug } from '@/components/task-management/task-debug';

/**
 * TaskManagementDebugPage
 * 
 * A client-side rendered debug page for the task management feature.
 * This page doesn't depend on server-side data fetching and should render
 * regardless of database or API issues.
 * 
 * To use: 
 * 1. Rename the existing page.tsx to page.original.tsx
 * 2. Rename this file to page.tsx
 * 3. Refresh the page to see if it renders
 * 4. Once debugging is complete, restore the original page
 */
export default function TaskManagementDebugPage() {
  return (
    <div className="h-full container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cornsilk-500">Task Management (Debug Mode)</h1>
        <p className="text-cornsilk-300 mt-1">This is a debug page to troubleshoot rendering issues.</p>
      </div>
      
      {/* Debug message that should always show */}
      <div className="mb-6 p-4 bg-red-600 text-white rounded-md">
        <h2 className="text-xl font-bold">Debug Mode Active</h2>
        <p>This page is currently in debug mode. It bypasses server-side rendering and database calls.</p>
        <p>If you're seeing this, client-side rendering is working correctly.</p>
        <p className="mt-2 font-bold">To restore normal functionality, rename files back to their original names.</p>
      </div>
      
      <TaskDebug />
    </div>
  );
}
