import '@arcadeai/arcadejs/shims/web';
import { Arcade } from '@arcadeai/arcadejs';

export const client = new Arcade({
  baseURL: process.env.NEXT_PUBLIC_ARCADE_BASE_URL || 'https://api.arcade.dev',
  apiKey: process.env.NEXT_PUBLIC_ARCADE_API_KEY,
});

export default client;
