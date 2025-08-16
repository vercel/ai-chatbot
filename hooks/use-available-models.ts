'use client';

import { useState, useEffect } from 'react';
import type { ChatModel } from '@/lib/ai/models';

export function useAvailableModels() {
  const [models, setModels] = useState<ChatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);
        const response = await fetch('/api/models/available');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        
        const data = await response.json();
        setModels(data.models || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching available models:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
        setModels([]);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  return { models, loading, error };
}