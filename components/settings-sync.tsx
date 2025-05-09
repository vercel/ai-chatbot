'use client';

import { useEffect } from 'react';

export function SettingsSync() {
  useEffect(() => {
    // Sync settings on initial load
    const syncSettings = async () => {
      try {
        await fetch('/api/sync-settings');
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    };

    syncSettings();
  }, []);

  // This component doesn't render anything visible
  return null;
}
