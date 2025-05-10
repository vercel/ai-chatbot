'use client';

import { signOut } from '@/app/(auth)/auth';

export const SignOutForm = () => {
  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    await signOut({
      redirectTo: '/',
    });
  };

  return (
    <form className="w-full" onSubmit={handleSignOut}>
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </form>
  );
};
