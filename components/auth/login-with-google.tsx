'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/icons';
import { Loader2 as Loader } from 'lucide-react';
import { toast } from 'sonner';

export function LoginWithGoogle() {
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email https://www.googleapis.com/auth/userinfo.email',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent select_account',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader className="size-4" />
      ) : (
        <React.Fragment>
          <GoogleIcon className="mr-2 size-4" />
          <span>Sign in with Google</span>
        </React.Fragment>
      )}
    </Button>
  );
}
