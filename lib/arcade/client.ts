import '@arcadeai/arcadejs/shims/web';
import { Arcade } from '@arcadeai/arcadejs';

export const client = new Arcade({
  baseURL: process.env.ARCADE_BASE_URL || 'https://api.arcade.dev',
  apiKey: process.env.ARCADE_API_KEY,
});

export default client;
