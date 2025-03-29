/**
 * Get the appropriate AI endpoint based on configuration
 * This abstracts away the AI endpoint details from the chat handler
 */
export function getAiEndpoint(): string {
  // In a real-world scenario, this might fetch from env variables
  // or do more complex routing based on model selection
  return process.env.AI_API_URL || '/api/ai';
} 