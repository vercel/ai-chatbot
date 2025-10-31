import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Parse API keys from environment variable
const CEREBRAS_API_KEYS_RAW = process.env.CEREBRAS_API_KEYS || '';
export const CEREBRAS_API_KEYS = CEREBRAS_API_KEYS_RAW
  .split('\n')
  .map(key => key.trim())
  .filter(key => key.length > 0 && key.startsWith('csk-'));

if (CEREBRAS_API_KEYS.length === 0) {
  console.warn('⚠️ No Cerebras API keys found in CEREBRAS_API_KEYS environment variable');
}

// Create a Cerebras client with a specific API key
export function getCerebrasClient(apiKey: string) {
  return new Cerebras({
    apiKey,
  });
}

// Get a random API key for load balancing
export function getRandomCerebrasKey(): string {
  if (CEREBRAS_API_KEYS.length === 0) {
    throw new Error('No Cerebras API keys available');
  }
  const randomIndex = Math.floor(Math.random() * CEREBRAS_API_KEYS.length);
  return CEREBRAS_API_KEYS[randomIndex];
}
