// Import the built Mastra app from local client build
import { ft as builtMastra } from '../../.mastra/output/mastra.mjs';

export const mastra = builtMastra;
export type { Agent } from '@mastra/core/agent';
