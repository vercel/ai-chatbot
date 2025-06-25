'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuth, hasAuthParams } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const auth = useAuth();
  const { t } = useTranslation();
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
      // FIXME - work on design
      <div className="bg-red-500 text-3xl text-white">
        {t('general.unableToSignIn', {
          error: auth.error.message,
        })}
      </div>
    );
  }

  // render spinner
  return (
    // FIXME - work on design
    <div className="bg-red-500 text-3xl text-white">{t('general.loading')}</div>
  );
}
