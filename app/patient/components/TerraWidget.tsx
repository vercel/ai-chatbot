'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const getWidgetAsync = async (props: { onSuccess: (url: string) => void }) => {
  try {
    console.log('Fetching widget URL...');
    const response = await fetch('/api/terra/generateWidgetSession', { method: 'GET' });
    console.log('Response status:', response.status);
    const json = await response.json();
    console.log('API Response:', json);
    if (json.url) {
      props.onSuccess(json.url);
    } else {
      console.error('No URL in response:', json);
    }
  } catch (error) {
    console.error('Error in getWidgetAsync:', error);
  }
};

export const Widget = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePressButton = async () => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('Button clicked');
      await getWidgetAsync({ 
        onSuccess: (newUrl: string) => {
          console.log('Received URL:', newUrl);
          if (newUrl) {
            window.open(newUrl, '_blank');
          } else {
            setError('Received empty URL from Terra API');
          }
        }
      });
    } catch (error) {
      console.error('Error opening widget:', error);
      setError('Failed to open widget');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={handlePressButton} 
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Open Widget'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};
