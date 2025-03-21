'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { ExtensionStatusPanel } from '@/components/extension/status-panel';
import { OfflineFilesPanel } from '@/components/extension/offline-files-panel';
import { Card } from '@/components/ui/card';

export default function ExtensionPage() {
  const [scanningFiles, setScanningFiles] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Initial scan for files when the page loads
  useEffect(() => {
    const scanNow = async () => {
      setScanningFiles(true);
      try {
        // Comment out the fetch call if causing issues in development
        // await fetch('/api/extension/process-all', {
        //   method: 'POST'
        // });
      } catch (error) {
        console.error("Error scanning files:", error);
      } finally {
        setScanningFiles(false);
        setScanned(true);
      }
    };
    
    scanNow();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Load debug helpers script */}
      <Script src="/debug-helpers.js" strategy="beforeInteractive" />
      
      <h1 className="text-3xl font-bold mb-6">Chrome Extension</h1>
      
      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-md">
        <p className="text-yellow-600 dark:text-yellow-400 font-medium">
          Debug Mode: Extension panels may be empty if no data is available.
          <span className="block mt-1 text-sm">
            Run <code>window.setupExtensionMockData()</code> in the browser console to add mock data.
          </span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <ExtensionStatusPanel />
        </div>
        
        <div className="col-span-1">
          <OfflineFilesPanel />
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <Card className="w-full overflow-hidden">
            <div className="bg-white dark:bg-hunter_green-400 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Extension Usage Guide</h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  The Wizzo Chrome Extension allows you to capture content even when the main platform is not running.
                  Once the platform is back online, your content will be automatically processed.
                </p>
                
                <h3 className="text-lg font-medium mt-4">Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Record audio for up to 5 minutes (including system audio when possible)</li>
                  <li>Add text files for later processing</li>
                  <li>Create quick notes for your knowledge base</li>
                  <li>All content is saved locally and to your downloads folder until the platform is available</li>
                </ul>
                
                <h3 className="text-lg font-medium mt-4">Installation</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Open Chrome and navigate to <code>chrome://extensions/</code></li>
                  <li>Enable "Developer mode" by toggling the switch in the top right corner</li>
                  <li>Click "Load unpacked" and select the <code>chrome-extension</code> folder</li>
                  <li>The extension should now appear in your Chrome toolbar</li>
                </ol>
                
                <p className="mt-4">
                  For more detailed instructions, refer to the{' '}
                  <a href="/docs/chrome-extension-integration.md" className="text-blue-600 hover:underline">
                    Chrome Extension Integration Guide
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}