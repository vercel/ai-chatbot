import { signIn } from '@/app/(auth)/auth';
import { Button } from '@/components/ui/button';

export function GoogleAuthForm() {
  return (
    <div>
      <form
        className="flex flex-col gap-4 px-4 sm:px-16"
        action={async () => {
          'use server';
          try {
            await signIn('google');
          } finally {
            // Handle completion
          }
        }}
      >
        <Button type="submit">Sign in with Google</Button>
      </form>
    </div>
  );
}
