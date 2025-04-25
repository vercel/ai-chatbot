'use client';

import { useUser } from '@clerk/nextjs';
// import { triggerOnboardingWebhook } from '@/app/actions/trigger-onboarding-webhook'; // No longer calling the action directly
import { useState } from 'react';

export function OnboardingTrigger({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleTriggerClick = async () => {
    setIsLoading(true);
    setResultMessage(null);
    console.log(
      '[OnboardingTrigger Button] Attempting to fetch /api/test-auth...',
    );
    try {
      // Call the API route instead of the Server Action
      const response = await fetch('/api/test-auth');
      const data = await response.json();

      console.log('[OnboardingTrigger Button] API route response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setResultMessage(`API Result: userId=${data.userId}`);
      if (!data.userId) {
        console.error(
          '[OnboardingTrigger Button] API route did not return userId.',
        );
      }
    } catch (error) {
      console.error(
        '[OnboardingTrigger Button] Error calling API route:',
        error,
      );
      const message =
        error instanceof Error ? error.message : 'Unknown client error';
      setResultMessage(`Client/API Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the children passed to it
  return <>{children}</>;
}
