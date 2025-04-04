import {
  GitHub,
  Google,
  Gmail,
  LinkedIn,
  Slack,
  Notion,
  X,
  Zoom,
  Discord,
  Codesandbox,
} from '@/components/icons/index';

import { Ruler, Search } from 'lucide-react';

type AuthProvider = {
  provider_id: string;
  toolkit_id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const AuthProviders: AuthProvider[] = [
  {
    provider_id: 'arcade-google',
    toolkit_id: 'google',
    name: 'Google',
    icon: Google,
  },
  {
    provider_id: 'arcade-github',
    toolkit_id: 'github',
    name: 'GitHub',
    icon: GitHub,
  },
  {
    provider_id: 'arcade-slack',
    toolkit_id: 'slack',
    name: 'Slack',
    icon: Slack,
  },
  {
    provider_id: 'arcade-gmail',
    toolkit_id: 'gmail',
    name: 'Gmail',
    icon: Gmail,
  },
  {
    provider_id: 'arcade-linkedin',
    toolkit_id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedIn,
  },
  {
    provider_id: 'arcade-notion',
    toolkit_id: 'notiontoolkit',
    name: 'Notion',
    icon: Notion,
  },
  {
    provider_id: 'arcade-x',
    toolkit_id: 'x',
    name: 'X',
    icon: X,
  },
  {
    provider_id: 'arcade-zoom',
    toolkit_id: 'zoom',
    name: 'Zoom',
    icon: Zoom,
  },
  {
    provider_id: 'discord',
    toolkit_id: 'discord',
    name: 'Discord',
    icon: Discord,
  },
  {
    provider_id: 'arcade-codesandbox',
    toolkit_id: 'codesandbox',
    name: 'Codesandbox',
    icon: Codesandbox,
  },
  {
    provider_id: 'arcade-math',
    toolkit_id: 'math',
    name: 'Math',
    icon: Ruler,
  },
  {
    provider_id: 'arcade-search',
    toolkit_id: 'search',
    name: 'Search',
    icon: Search,
  },
];

export const getAuthProviderByProviderId = (
  provider_id?: string,
): AuthProvider | undefined => {
  if (!provider_id) {
    return undefined;
  }

  return AuthProviders.find((provider) => provider.provider_id === provider_id);
};

export const getAuthProviderByToolkitId = (
  toolkit_id?: string,
): AuthProvider | undefined => {
  if (!toolkit_id) {
    return undefined;
  }

  return AuthProviders.find((provider) => provider.toolkit_id === toolkit_id);
};
