import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel, type LanguageModelV1 } from 'ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { customMiddleware } from './custom-middleware';
import { getModelById } from './models';

const DEFAULT_FALLBACK = "I apologize, but I couldn't process that request. Please try again.";

const createFallbackModel = (apiIdentifier: string): LanguageModelV1 => {
  const modelConfig = getModelById(apiIdentifier);
  const fallbackResponse = modelConfig?.fallbackResponse ?? DEFAULT_FALLBACK;

  return {
    specificationVersion: 'v1',
    provider: modelConfig?.provider || 'openai',
    modelId: apiIdentifier,
    defaultObjectGenerationMode: 'json',

    async doGenerate(options) {
      console.log('⚠️ Using fallback model for:', apiIdentifier);
      return {
        text: fallbackResponse,
        finishReason: 'error',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: '', rawSettings: {} }
      };
    },

    async doStream(options) {
      console.log('⚠️ Using fallback stream for:', apiIdentifier);
      return {
        stream: new ReadableStream({
          start(controller) {
            try {
              controller.enqueue({
                type: 'text-delta',
                textDelta: fallbackResponse
              });
              controller.enqueue({
                type: 'finish',
                finishReason: 'error',
                usage: { promptTokens: 0, completionTokens: 0 }
              });
              controller.close();
            } catch (error) {
              console.error('❌ Fallback stream error:', error);
              // Even if streaming fails, ensure we send something
              controller.enqueue({
                type: 'text-delta',
                textDelta: DEFAULT_FALLBACK
              });
              controller.close();
            }
          }
        }),
        rawCall: { rawPrompt: '', rawSettings: {} }
      };
    }
  };
};

const createGeminiModel = (apiIdentifier: string): LanguageModelV1 => {
  console.log('🔑 Initializing Gemini with API key:', process.env.GOOGLE_API_KEY ? 'Present' : 'Missing');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const processPrompt = (options: any) => {
    const systemMessage = options.prompt.find((m: any) => m.role === 'system');
    const userMessages = options.prompt.filter((m: any) => m.role === 'user');

    const prompt = [
      systemMessage ? `Instructions: ${systemMessage.content}` : '',
      ...userMessages.map((m: any) =>
        m.content.map((c: any) => c.type === 'text' ? c.text : '').join('')
      )
    ].filter(Boolean).join('\n\n');

    console.log('📝 Processed prompt:', prompt);
    return prompt;
  };

  return {
    specificationVersion: 'v1',
    provider: 'google',
    modelId: apiIdentifier,
    defaultObjectGenerationMode: 'json',

    async doGenerate(options) {
      try {
        const fullPrompt = processPrompt(options);
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        console.log('✅ Gemini response:', text);

        return {
          text,
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0 },
          rawCall: { rawPrompt: fullPrompt, rawSettings: {} }
        };
      } catch (error) {
        console.error('❌ Gemini generation error:', error);
        const modelConfig = getModelById(apiIdentifier);
        return {
          text: modelConfig?.fallbackResponse || "I apologize, but I couldn't process that request. Please try again.",
          finishReason: 'error',
          usage: { promptTokens: 0, completionTokens: 0 },
          rawCall: { rawPrompt: '', rawSettings: {} }
        };
      }
    },

    async doStream(options) {
      try {
        const fullPrompt = processPrompt(options);
        const result = await model.generateContentStream(fullPrompt);

        return {
          stream: new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.stream) {
                  const text = chunk.text();
                  if (text?.trim()) {
                    controller.enqueue({
                      type: 'text-delta',
                      textDelta: text
                    });
                  }
                }

                controller.enqueue({
                  type: 'finish',
                  finishReason: 'stop',
                  usage: { promptTokens: 0, completionTokens: 0 }
                });

                controller.close();
              } catch (error) {
                console.error('❌ Stream processing error:', error);
                const modelConfig = getModelById(apiIdentifier);
                controller.enqueue({
                  type: 'text-delta',
                  textDelta: modelConfig?.fallbackResponse || "I apologize, but I couldn't process that request. Please try again."
                });
                controller.enqueue({
                  type: 'finish',
                  finishReason: 'error',
                  usage: { promptTokens: 0, completionTokens: 0 }
                });
                controller.close();
              }
            }
          }),
          rawCall: { rawPrompt: fullPrompt, rawSettings: {} }
        };
      } catch (error) {
        console.error('❌ Stream initialization error:', error);
        const modelConfig = getModelById(apiIdentifier);
        return {
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue({
                type: 'text-delta',
                textDelta: modelConfig?.fallbackResponse || "I apologize, but I couldn't process that request. Please try again."
              });
              controller.enqueue({
                type: 'finish',
                finishReason: 'error',
                usage: { promptTokens: 0, completionTokens: 0 }
              });
              controller.close();
            }
          }),
          rawCall: { rawPrompt: '', rawSettings: {} }
        };
      }
    }
  };
};

export const customModel = (apiIdentifier: string) => {
  try {
    if (apiIdentifier.includes('gemini')) {
      return wrapLanguageModel({
        model: createGeminiModel(apiIdentifier),
        middleware: customMiddleware,
      });
    }

    // For OpenAI, return a fallback model if no API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ No OpenAI API key, using fallback response');
      const modelConfig = getModelById(apiIdentifier);
      return wrapLanguageModel({
        model: createGeminiModel(apiIdentifier), // Use Gemini as fallback
        middleware: customMiddleware,
      });
    }

    return wrapLanguageModel({
      model: openai(apiIdentifier),
      middleware: customMiddleware,
    });
  } catch (error) {
    console.error('❌ Model initialization error:', error);
    return wrapLanguageModel({
      model: createGeminiModel(apiIdentifier), // Use Gemini as fallback
      middleware: customMiddleware,
    });
  }
};
