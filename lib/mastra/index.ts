// Use MastraClient to connect to the Mastra server
import { MastraClient } from '@mastra/client-js';

export const mastra = new MastraClient({
  baseUrl: process.env.MASTRA_SERVER_URL || "http://localhost:4111",
});
export type { Agent } from '@mastra/core/agent';
