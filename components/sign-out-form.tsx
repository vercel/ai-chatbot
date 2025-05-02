'use client';

import { useRouter } from 'next/navigation';

export const SignOutForm = () => {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left px-1 py-0.5 text-red-500"
    >
      Sign out
    </button>
  );
};
