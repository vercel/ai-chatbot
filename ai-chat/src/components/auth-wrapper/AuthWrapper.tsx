'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuth, hasAuthParams } from 'react-oidc-context';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const auth = useAuth();
  const [hasTriedSignin, setHasTriedSignin] = useState(false);

  // automatically sign-in
  useEffect(() => {
    if (
      !hasAuthParams() &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.isLoading &&
      !auth.error &&
      !hasTriedSignin
    ) {
      auth.signinRedirect();
      setHasTriedSignin(true); // just redirect once
    }
  }, [auth, hasTriedSignin]);

  if (auth.isAuthenticated) {
    return <>{children}</>;
  }

  if (auth.error) {
    return (
      <div className="bg-background text-9xl text-white">
        Unable to sign-in: {auth.error.message}
      </div>
    );
  }

  // render spinner
  return <div className="bg-background text-9xl text-white">loading</div>;
}
