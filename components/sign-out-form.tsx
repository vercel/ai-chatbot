import Form from 'next/form';
import { createClient } from '@/lib/supabase/client';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        const supabase = createClient();
        await supabase.auth.signOut({
          // options can be added here if needed, e.g., scope
        });

        // Redirecting is usually handled client-side after sign-out
        // or via middleware based on auth state.
        // The previous `redirectTo` was likely for an older auth system.
        // We might need to adjust redirection logic elsewhere.
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
