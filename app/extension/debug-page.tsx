'use client';

import React from 'react';
import { ExtensionDebug } from '@/components/extension/extension-debug';

/**
 * ExtensionDebugPage
 * 
 * A client-side rendered debug page for the extension feature.
 * This page doesn't depend on API calls and should render
 * regardless of backend issues.
 * 
 * To use: 
 * 1. Rename the existing page.tsx to page.original.tsx
 * 2. Rename this file to page.tsx
 * 3. Refresh the page to see if it renders
 * 4. Once debugging is complete, restore the original page
 */
export default function ExtensionDebugPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Chrome Extension (Debug Mode)</h1>
      
      {/* Debug message that should always show */}
      <div className="mb-6 p-4 bg-red-600 text-white rounded-md">
        <h2 className="text-xl font-bold">Debug Mode Active</h2>
        <p>This page is currently in debug mode. It bypasses API calls and data fetching.</p>
        <p>If you're seeing this, client-side rendering is working correctly.</p>
        <p className="mt-2 font-bold">To restore normal functionality, rename files back to their original names.</p>
      </div>
      
      <ExtensionDebug />
    </div>
  );
}
