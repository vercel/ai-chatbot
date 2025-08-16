'use client';

import { useEffect, useState } from 'react';

interface ProviderStatus {
  openai: boolean;
  anthropic: boolean;
  google: boolean;
}

export function useProviders() {
  const [providers, setProviders] = useState<ProviderStatus>({
    openai: false,
    anthropic: false,
    google: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      try {
        console.log('🔄 Fetching provider status from /api/providers...');
        const response = await fetch('/api/providers');
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Provider status received:', data.providers);
          setProviders(data.providers);
        } else {
          console.error('❌ Provider API response not ok:', response.status, response.statusText);
        }
      } catch (error) {
        console.warn('❌ Failed to fetch provider status:', error);
      } finally {
        setLoading(false);
        console.log('🏁 Provider loading complete');
      }
    }

    fetchProviders();
  }, []);

  return { providers, loading };
}