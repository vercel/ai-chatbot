 import { openrouter } from './models';
 import type { LanguageModel } from 'ai';
 
 export function getModel(modelId?: string): LanguageModel {
   const selectedModel = modelId || process.env.OPENROUTER_MODEL || 'google/gemini-flash-1.5';
 
   if (!selectedModel) {
     throw new Error('No model specified in API route or environment variables.');
   }
 
   // Pass the model ID directly to the OpenRouter provider
   return openrouter(selectedModel);
 }