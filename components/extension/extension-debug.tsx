'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Mic, FileText, StickyNote } from 'lucide-react';

/**
 * ExtensionDebug component
 * 
 * This is a simple debugging component to help troubleshoot rendering issues
 * with the Extension page. It doesn't rely on any API calls or complex state.
 */
export function ExtensionDebug() {
  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      <script dangerouslySetInnerHTML={{
        __html: `
          // Create mock data in localStorage if it doesn't exist
          window.setupExtensionMockData = () => {
            const mockFiles = [
              { id: 'f1', name: 'Recording 1.mp3', type: 'audio', size: '2.3 MB', status: 'ready' },
              { id: 'f2', name: 'Notes from meeting.txt', type: 'text', size: '4.1 KB', status: 'ready' },
              { id: 'f3', name: 'Quick note.txt', type: 'note', size: '1.5 KB', status: 'ready' }
            ];
            
            const mockOfflineFiles = [
              { id: 'of1', name: 'Offline recording.webm', type: 'audio', size: '3.7 MB', timestamp: new Date().toISOString() },
              { id: 'of2', name: 'Offline note.txt', type: 'text', size: '2.9 KB', timestamp: new Date().toISOString() }
            ];
            
            localStorage.setItem('extension_unprocessed_files', JSON.stringify(mockFiles));
            localStorage.setItem('extension_offline_files', JSON.stringify(mockOfflineFiles));
            console.log('Extension mock data created');
            
            // Reload to apply changes
            window.location.reload();
          };
          
          // Auto-setup mock data if none exists
          if (!localStorage.getItem('extension_unprocessed_files')) {
            window.setupExtensionMockData();
          }
        `
      }} />
      
      {/* Status Panel Debug */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Extension Status Panel (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a debug version of the status panel component.</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center">
              <Mic className="h-4 w-4 mr-1" /> 3 Recordings
            </div>
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
              <FileText className="h-4 w-4 mr-1" /> 2 Texts
            </div>
            <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center">
              <StickyNote className="h-4 w-4 mr-1" /> 1 Notes
            </div>
          </div>
          
          <Button className="w-full mb-4">
            Process All Files (Mock)
            <Download className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-md">
                <div className="font-medium">Test File {i}.mp3</div>
                <div className="text-sm text-gray-500">Mock file for debugging</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Offline Files Panel Debug */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Offline Files Panel (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a debug version of the offline files panel component.</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center">
              <Mic className="h-4 w-4 mr-1" /> 2 Recordings
            </div>
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
              <FileText className="h-4 w-4 mr-1" /> 1 Texts
            </div>
            <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center">
              <StickyNote className="h-4 w-4 mr-1" /> 0 Notes
            </div>
          </div>
          
          <Button className="w-full mb-4">
            Process Offline Files (Mock)
            <Download className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-md">
                <div className="font-medium">Offline File {i}.txt</div>
                <div className="text-sm text-gray-500">Mock offline file for debugging</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Extension Guide Debug */}
      <Card className="w-full col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Extension Guide (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a debug version of the extension guide component.</p>
          
          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-bold mb-2">Extension Features (Mock)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Record audio for up to 5 minutes</li>
              <li>Add text files for processing</li>
              <li>Create quick notes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Debug Info */}
      <Card className="w-full col-span-1 md:col-span-2 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Debugging Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>If you can see this component, the basic rendering for the extension page is working.</p>
            
            <div className="p-3 bg-gray-100 rounded-md">
              <h3 className="font-bold mb-2">Debugging Steps</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Check browser console for API request errors</li>
                <li>Test extension API endpoints directly</li>
                <li>Verify that the components are receiving data</li>
                <li>Check for styling issues that might hide content</li>
                <li>Ensure all dependencies are installed</li>
              </ol>
            </div>
            
            <div className="p-3 bg-red-100 text-red-800 rounded-md">
              <h3 className="font-bold mb-2">Common Issues</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>API endpoints returning errors</li>
                <li>Missing environment variables</li>
                <li>CSS conflicts hiding elements</li>
                <li>React component mounting issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
