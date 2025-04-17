import { anthropic } from './anthropic';
import { xai } from './xi';

const providers = {
  anthropic,
  xai,
};

export const myProvider =
  providers[
    (process.env.API_KEY_PROVIDER as keyof typeof providers) || 'anthropic'
  ];
