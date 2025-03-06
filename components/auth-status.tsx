'use client';

import { useUser } from "@civic/auth-web3/react";
import type { User } from '@/lib/types/auth';

export function AuthStatus() {
  const { user, signIn, signOut } = useUser();

  if (!user) {
    return (
      <button onClick={() => signIn()}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
} 