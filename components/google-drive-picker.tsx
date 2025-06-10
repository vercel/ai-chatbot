'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { GoogleDriveFile } from '@/lib/google-drive';

interface GoogleDrivePickerProps {
  onFileSelect: (file: GoogleDriveFile) => void;
}

export function GoogleDrivePicker({ onFileSelect }: GoogleDrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = () => {
    console.log('=== Google Drive Auth Flow Start ===');
    console.log('1. Button clicked, starting auth process');
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Direct navigation to the auth endpoint
      console.log('2. Navigating to /api/google-drive/auth');
      window.location.href = '/api/google-drive/auth';
    } catch (err) {
      console.error('=== Google Drive Auth Flow Error ===', err);
      setError(err instanceof Error ? err.message : 'Failed to start Google Drive authentication');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handleAuth}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          'Connecting...'
        ) : (
          <>
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.433 22l-3.975-6.875h7.95L4.433 22zm7.95-6.875h7.95L12.383 22H4.433l7.95-6.875zm7.95-6.875h7.95L20.333 22h-7.95l7.95-13.75zM12.383 2L4.433 8.875h7.95L12.383 2zm7.95 0l-7.95 6.875h7.95L20.333 2z" />
            </svg>
            Connect Google Drive
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Helper function to show file selection dialog
function showFileSelectionDialog(files: GoogleDriveFile[]): Promise<GoogleDriveFile | null> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'p-4 rounded-lg shadow-lg';
    dialog.innerHTML = `
      <div class="max-h-96 overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">Select a file</h3>
        <div class="space-y-2">
          ${files.map(file => `
            <button class="w-full text-left p-2 hover:bg-gray-100 rounded" data-id="${file.id}">
              ${file.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        const fileId = target.getAttribute('data-id');
        const selectedFile = files.find(f => f.id === fileId);
        dialog.close();
        resolve(selectedFile || null);
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  });
} 