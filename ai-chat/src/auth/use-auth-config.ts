'use client';

import { useMemo } from 'react';
import type { AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore, User } from 'oidc-client-ts';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import {} from '@ai-chat/lib/constants';

const ENV_META = process.env;

// Azure AD authentication parameters for OAuth2
const staticAuthParams = {
  stsAuthority: `https://login.microsoftonline.com/${ENV_META.NEXT_PUBLIC_AZURE_AD_TENANT_ID}/v2.0`,
  clientId: ENV_META.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '',
  clientScope: `${ENV_META.NEXT_PUBLIC_AZURE_AD_CLIENT_ID}/.default`,
};

export function useAuthConfig(): AuthProviderProps | null {
  if (typeof window === 'undefined') return null; // Only run on client

  // only include the port if it exists (e.g. http://localhost:3000/ or https://custom-domain.com/)
  const clientRoot = `${window.location.protocol}//${window.location.hostname}${
    // biome-ignore lint/style/useTemplate: <explanation>
    window.location.port ? ':' + window.location.port : ''
  }/`;

  // oidc-client-ts docs recommendation: remove payload from URL upon successful login
  const onSigninCallback = (_user: User | undefined): void => {
    window.location.replace('/');
  };

  return useMemo(
    () => ({
      authority: staticAuthParams.stsAuthority,
      client_id: staticAuthParams.clientId,
      redirect_uri: `${clientRoot}signin-callback`,
      response_type: 'code',
      scope: staticAuthParams.clientScope,
      refreshTokenAllowedScope: staticAuthParams.clientScope,
      onSigninCallback,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    }),
    [],
  );
}

// Only call from client-side code!
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;

  const oidcStorage = localStorage.getItem(
    `oidc.user:${staticAuthParams.stsAuthority}:${staticAuthParams.clientId}`,
  );
  if (!oidcStorage) return null;

  return User.fromStorageString(oidcStorage);
}

export function getAuthToken(): string | undefined {
  return getUser()?.access_token;
}

interface AzureADJwtPayload extends JwtPayload {
  name?: string;
  upn?: string;
  unique_name?: string;
}

function getOAuthUserData(): AzureADJwtPayload | undefined {
  const authToken = getAuthToken();
  if (authToken) return jwtDecode(authToken);
  return undefined;
}

export function getOAuthUserName(): string | undefined {
  return getOAuthUserData()?.name;
}

export function getOAuthUserEmail(): string | undefined {
  return getOAuthUserData()?.upn;
}

export function getOAuthUserUniqueName(): string | undefined {
  return getOAuthUserData()?.unique_name;
}

export const getOAuthUserNameInitials = (): string => {
  const name = getOAuthUserName();

  if (!name || typeof name !== 'string') {
    return 'U';
  }

  function getInitials(name: string) {
    const nameArray = name.split(' ');
    const firstName = nameArray[0].charAt(0).toUpperCase();

    if (nameArray.length === 1) {
      return firstName; // Return only the first initial if there's only one name
    }

    const lastName = nameArray[nameArray.length - 1].charAt(0).toUpperCase();
    return firstName + lastName;
  }

  const initials = getInitials(name);

  return initials;
};
