'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 as Loader } from 'lucide-react';
import { GoogleIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'login' | 'register';
}

export function AuthForm({ type, className, ...props }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={signInWithGoogle}
      >
        {isLoading ? (
          <Loader className="mr-2 size-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 size-4" />
        )}
        Continue with Google
      </Button>
    </div>
  );
}
