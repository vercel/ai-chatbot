'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * TaskDebug component
 * 
 * This is a simple debugging component to help troubleshoot rendering issues
 * with the Task Management page. It doesn't rely on any database or complex state.
 */
export function TaskDebug() {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-600 text-white p-4 rounded-md">
        <h2 className="text-xl font-bold">Debug Component</h2>
        <p>This is a debug component to verify rendering is working.</p>
        <p>If you can see this, the basic rendering pipeline is functional.</p>
      </div>
      
      <Card className="bg-hunter_green-500 border-hunter_green-600">
        <CardHeader>
          <CardTitle className="text-cornsilk-500">Task Management Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-cornsilk-300 mb-4">
            If you can see this card, the UI components and styling are working correctly.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="default">Test Button 1</Button>
            <Button variant="secondary">Test Button 2</Button>
            <Button variant="outline">Test Button 3</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-hunter_green-600 p-4 rounded-md text-cornsilk-200">
              Grid Item 1 - This tests the grid layout
            </div>
            <div className="bg-hunter_green-700 p-4 rounded-md text-cornsilk-200">
              Grid Item 2 - This tests the grid layout
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 p-4 border border-red-500 rounded-md">
        <h3 className="font-bold text-red-500">Debugging Steps</h3>
        <ol className="list-decimal list-inside space-y-2 mt-2">
          <li>Check browser console for errors</li>
          <li>Verify database tables exist and connection is working</li>
          <li>Test API endpoints directly</li>
          <li>Check that components are receiving the correct props</li>
          <li>Verify that task data is being fetched correctly</li>
        </ol>
      </div>
    </div>
  );
}
