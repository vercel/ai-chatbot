import { openai } from '@ai-sdk/openai';
import { Anthropic } from '@anthropic-ai/sdk';
import {
  customProvider,
} from 'ai';

// Get the API key from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY is not set in environment variables');
}

const anthropicClient = new Anthropic({
  apiKey: ANTHROPIC_API_KEY || '',
});

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';  // Claude 3.5 Haiku

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': {
      specificationVersion: '1.0.0',  // Required property
      doGenerate: async (options) => {
        const result = await anthropicClient.messages.create({
          model: 'claude-3-5-haiku-20240307',
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature,
          system: options.prompt[0]?.role === 'system' ? options.prompt[0].content : undefined,
          messages: options.prompt
            .filter(msg => msg.role !== 'system')
            .map(msg => {
              if (msg.role === 'user') {
                return {
                  role: 'user',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else if (msg.role === 'assistant') {
                return {
                  role: 'assistant',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else {
                return null;
              }
            })
            .filter(Boolean),
        });
        
        return {
          text: result.content[0].text,
          usage: {
            promptTokens: result.usage.input_tokens,
            completionTokens: result.usage.output_tokens,
          },
          finishReason: result.stop_reason === 'stop_sequence' ? 'stop' : 'length',
          warnings: [],
          rawCall: { rawPrompt: options.prompt, rawSettings: {} },
          rawResponse: { headers: {} },
          request: {},
          response: {},
        };
      },
      doStream: async (options) => {
        // Define the mapFinishReason utility function
        const mapFinishReason = (stopReason: any): 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'unknown' => {
          if (!stopReason) return 'unknown';
          switch (stopReason) {
            case 'stop_sequence': return 'stop';
            case 'max_tokens': return 'length';
            case 'content_filter': return 'content-filter';
            default: return 'unknown';
          }
        };
        const stream = await anthropicClient.messages.create({
          model: 'claude-3-5-haiku-20240307',
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature,
          system: options.prompt[0]?.role === 'system' ? options.prompt[0].content : undefined,
          messages: options.prompt
            .filter(msg => msg.role !== 'system')
            .map(msg => {
              if (msg.role === 'user') {
                return {
                  role: 'user',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else if (msg.role === 'assistant') {
                return {
                  role: 'assistant',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else {
                return null;
              }
            })
            .filter(Boolean),
          stream: true,
        });

        let usage = { 
          promptTokens: 0,
          completionTokens: 0
        };
        
        const textStream = new ReadableStream({
          async start(controller) {
            controller.enqueue({ type: 'response-metadata' });
            
            for await (const message of stream) {
              if (message.type === 'content_block_delta') {
                controller.enqueue({ 
                  type: 'text-delta',
                  textDelta: message.delta.text 
                });
              } else if (message.type === 'message_stop') {
                // When the message is complete, we have usage statistics
                if (message.usage) {
                  usage.promptTokens = message.usage.input_tokens;
                  usage.completionTokens = message.usage.output_tokens;
                }
                
                controller.enqueue({
                  type: 'finish',
                  finishReason: message.usage?.stop_reason ? mapFinishReason(message.usage.stop_reason) : 'stop',
                  usage: usage
                });
                
                controller.close();
              }
            }
          }
        });

        return {
          stream: textStream,
          rawCall: { rawPrompt: options.prompt, rawSettings: {} },
          rawResponse: { headers: {} },
          warnings: [],
          request: {}
        };
      },
      modelId: 'claude-3-5-haiku-20240307',
      provider: 'anthropic.chat',
      supportsImageUrls: false,
      supportsStructuredOutputs: false,
      defaultObjectGenerationMode: 'json'
    },
    'chat-model-large': openai('gpt-4o'),
    'title-model': openai('gpt-4-turbo'),
    'artifact-model': {
      specificationVersion: '1.0.0',  // Required property
      doGenerate: async (options) => {
        const result = await anthropicClient.messages.create({
          model: 'claude-3-5-haiku-20240307',
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature,
          system: options.prompt[0]?.role === 'system' ? options.prompt[0].content : undefined,
          messages: options.prompt
            .filter(msg => msg.role !== 'system')
            .map(msg => {
              if (msg.role === 'user') {
                return {
                  role: 'user',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else if (msg.role === 'assistant') {
                return {
                  role: 'assistant',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else {
                return null;
              }
            })
            .filter(Boolean),
        });
        
        return {
          text: result.content[0].text,
          usage: {
            promptTokens: result.usage.input_tokens,
            completionTokens: result.usage.output_tokens,
          },
          finishReason: result.stop_reason === 'stop_sequence' ? 'stop' : 'length',
          warnings: [],
          rawCall: { rawPrompt: options.prompt, rawSettings: {} },
          rawResponse: { headers: {} },
          request: {},
          response: {},
        };
      },
      doStream: async (options) => {
        // Define the mapFinishReason utility function
        const mapFinishReason = (stopReason: any): 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'unknown' => {
          if (!stopReason) return 'unknown';
          switch (stopReason) {
            case 'stop_sequence': return 'stop';
            case 'max_tokens': return 'length';
            case 'content_filter': return 'content-filter';
            default: return 'unknown';
          }
        };
        
        const stream = await anthropicClient.messages.create({
          model: 'claude-3-5-haiku-20240307',
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature,
          system: options.prompt[0]?.role === 'system' ? options.prompt[0].content : undefined,
          messages: options.prompt
            .filter(msg => msg.role !== 'system')
            .map(msg => {
              if (msg.role === 'user') {
                return {
                  role: 'user',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else if (msg.role === 'assistant') {
                return {
                  role: 'assistant',
                  content: typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
                }
              } else {
                return null;
              }
            })
            .filter(Boolean),
          stream: true,
        });

        let usage = { 
          promptTokens: 0,
          completionTokens: 0
        };
        
        const textStream = new ReadableStream({
          async start(controller) {
            controller.enqueue({ type: 'response-metadata' });
            
            for await (const message of stream) {
              if (message.type === 'content_block_delta') {
                controller.enqueue({ 
                  type: 'text-delta',
                  textDelta: message.delta.text 
                });
              } else if (message.type === 'message_stop') {
                // When the message is complete, we have usage statistics
                if (message.usage) {
                  usage.promptTokens = message.usage.input_tokens;
                  usage.completionTokens = message.usage.output_tokens;
                }
                
                controller.enqueue({
                  type: 'finish',
                  finishReason: message.usage?.stop_reason ? mapFinishReason(message.usage.stop_reason) : 'stop',
                  usage: usage
                });
                
                controller.close();
              }
            }
          }
        });

        return {
          stream: textStream,
          rawCall: { rawPrompt: options.prompt, rawSettings: {} },
          rawResponse: { headers: {} },
          warnings: [],
          request: {}
        };
      },
      modelId: 'claude-3-5-haiku-20240307',
      provider: 'anthropic.chat',
      supportsImageUrls: false,
      supportsStructuredOutputs: false,
      defaultObjectGenerationMode: 'json'
    },
  },
  imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Claude 3.5 Haiku',
    description: 'Fast, lightweight tasks with Anthropic model',
  },
  {
    id: 'chat-model-large',
    name: 'GPT-4o',
    description: 'Large model for complex, multi-step tasks',
  }
];
