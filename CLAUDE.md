---
alwaysApply: true
---

Access authentication data
AuthKit can be used in both server and client components.

FOR A CLIENT COMPONENT: 

'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function HomePage() {
  // Retrieves the user from the session or returns `null` if no user is signed in
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
    </>
  );
}

FOR A SERVER COMPONENT: 

import Link from 'next/link';
import { getSignUpUrl, withAuth } from '@workos-inc/authkit-nextjs';

export default async function HomePage() {
  // Retrieves the user from the session or returns `null` if no user is signed in
  const { user } = await withAuth();

  // Get the URL to redirect the user to AuthKit to sign up
  const signUpUrl = await getSignUpUrl();

  if (!user) {
    return (
      <>
        <a href="/login">Sign in</a>
        <Link href={signUpUrl}>Sign up</Link>
      </>
    );
  }

  return (
    <>
      <p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
    </>
  );
}Access authentication data
AuthKit can be used in both server and client components.

FOR A CLIENT COMPONENT: 

'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function HomePage() {
  // Retrieves the user from the session or returns `null` if no user is signed in
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
    </>
  );
}


Protected routes
For routes where a signed in user is mandatory, you can use the ensureSignedIn option.


SERVER COMPONENT:

import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function ProtectedPage() {
  // If the user isn't signed in, they will be automatically redirected to AuthKit
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <>
      <p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
    </>
  );
}

CLIENT COMPONENT

'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function HomePage() {
  // If the user isn't signed in, they will be automatically redirected to AuthKit
  const { user, loading } = useAuth({ ensureSignedIn: true });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
    </>
  );
}



NOTE: there is no such thing as 'import { getSignOutUrl } from '@workos-inc/authkit-nextjs';'

the CORRECT import is: import Link from 'next/link';
import {
  getSignUpUrl,
  withAuth,
  signOut,
} from '@workos-inc/authkit-nextjs';

Here's what that looks like in practice:

import Link from 'next/link';
import {
  getSignUpUrl,
  withAuth,
  signOut,
} from '@workos-inc/authkit-nextjs';

export default async function HomePage() {
  // Retrieves the user from the session or returns `null` if no user is signed in
  const { user } = await withAuth();

  // Get the URL to redirect the user to AuthKit to sign up
  const signUpUrl = await getSignUpUrl();

  if (!user) {
    return (
      <>
        <a href="/login">Sign in</a>
        <Link href={signUpUrl}>Sign up</Link>
      </>
    );
  }

  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
      <button type="submit">Sign out</button>
    </form>
  );
}
