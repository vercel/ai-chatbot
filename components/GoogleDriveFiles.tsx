// components/GoogleDriveFiles.tsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface File {
  id: string;
  name: string;
  webViewLink: string;
}

export default function GoogleDriveFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [authCode, setAuthCode] = useState<string | null>(null);

  useEffect(() => {
    if (authCode) {
      const authenticate = async () => {
        const response = await fetch('/api/googleDriveAuth', {
          method: 'POST',
          body: JSON.stringify({ code: authCode }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        // Store the tokens securely (e.g., in HTTP-only cookies or session storage)
        console.log('Authentication successful:', data);
      };

      authenticate();
    }
  }, [authCode]);

  const handleAuthRedirect = () => {
    window.location.href = '/api/googleDriveAuth'; // Redirect to Google OAuth consent screen
  };

  const handleOpenAttachment = async (fileId: string) => {
    const response = await fetch(`/api/googleDrive?fileId=${fileId}`);
    const fileData = await response.json();
    if (fileData.webViewLink) {
      window.open(fileData.webViewLink, '_blank'); // Open the file in a new tab
    }
  };

  const fetchFiles = async () => {
    const response = await fetch('/api/googleDrive');
    const data = await response.json();
    setFiles(data);
  };

  return (
    <div>
      <Button onClick={handleAuthRedirect}>Authenticate with Google Drive</Button>
      <Button onClick={fetchFiles}>Fetch Files</Button>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            {file.name} <button onClick={() => handleOpenAttachment(file.id)}>Open</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
