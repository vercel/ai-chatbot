import Form from 'next/form';
import { createClient } from '@/lib/supabase/client';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        const supabase = createClient();
        await supabase.auth.signOut();
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
