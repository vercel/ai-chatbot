import { signIn } from '@/app/(auth)/auth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function GoogleAuthForm() {
  return (
    <div>
      <form
        className="flex flex-col w-full"
        action={async () => {
          'use server';
          try {
            await signIn('google', {
              redirectTo: '/',
              redirect: true
            });
          } finally {
            // Handle completion
          }
        }}
      >
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-3 py-6 text-base hover:bg-accent hover:text-accent-foreground transition-colors"
          type="submit"
        >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={20}
            height={20}
            className="shrink-0"
            priority
          />
          Sign in with Google
        </Button>
      </form>
    </div>
  );
}
