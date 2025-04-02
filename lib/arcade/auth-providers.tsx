import Google from '@/components/icons/google';

type AuthProvider = {
  provider_id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const AuthProviders: AuthProvider[] = [
  {
    provider_id: 'arcade-google',
    name: 'Google',
    icon: Google,
  },
];

export const getAuthProvider = (
  provider_id?: string,
): AuthProvider | undefined => {
  if (!provider_id) {
    return undefined;
  }

  return AuthProviders.find((provider) => provider.provider_id === provider_id);
};
