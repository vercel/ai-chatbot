import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel, type LanguageModelV1 } from 'ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  // If it's a Gemini model, use Google's API
  if (apiIdentifier.includes('gemini')) {
    console.log('🔑 Using API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: apiIdentifier });

    const geminiModel: LanguageModelV1 = {
      specificationVersion: 'v1',
      provider: 'google',
      modelId: apiIdentifier,
      defaultObjectGenerationMode: 'json',

      async doGenerate(options) {
        console.log('📝 Processing prompt:', options.prompt);

        // Combine system message and user messages
        const systemMessage = options.prompt.find(m => m.role === 'system');
        const userMessages = options.prompt.filter(m => m.role === 'user');

        const fullPrompt = [
          systemMessage ? `Instructions: ${systemMessage.content}` : '',
          ...userMessages.map(m =>
            m.content.map(c => c.type === 'text' ? c.text : '').join('')
          )
        ].filter(Boolean).join('\n\n');

        console.log('📤 Full prompt:', fullPrompt);

        try {
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          console.log('✅ Gemini response:', response.text());

          return {
            text: response.text(),
            finishReason: 'stop',
            usage: {
              promptTokens: 0,
              completionTokens: 0
            },
            rawCall: {
              rawPrompt: fullPrompt,
              rawSettings: {}
            }
          };
        } catch (error) {
          console.error('❌ Gemini error:', error);
          throw error;
        }
      },

      async doStream(options) {
        console.log('🌊 Starting stream with prompt:', options.prompt);

        // Combine system message and user messages
        const systemMessage = options.prompt.find(m => m.role === 'system');
        const userMessages = options.prompt.filter(m => m.role === 'user');

        const fullPrompt = [
          systemMessage ? `Instructions: ${systemMessage.content}` : '',
          ...userMessages.map(m =>
            m.content.map(c => c.type === 'text' ? c.text : '').join('')
          )
        ].filter(Boolean).join('\n\n');

        console.log('📤 Full prompt for stream:', fullPrompt);

        try {
          const result = await model.generateContentStream(fullPrompt);

          return {
            stream: new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of result.stream) {
                    const text = chunk.text();
                    console.log('📨 Stream chunk:', text);
                    controller.enqueue({
                      type: 'text-delta',
                      textDelta: text
                    });
                  }

                  // Add finish part
                  controller.enqueue({
                    type: 'finish',
                    finishReason: 'stop',
                    usage: {
                      promptTokens: 0,
                      completionTokens: 0
                    }
                  });

                  controller.close();
                } catch (error) {
                  console.error('❌ Stream processing error:', error);
                  controller.error(error);
                }
              }
            }),
            rawCall: {
              rawPrompt: fullPrompt,
              rawSettings: {}
            }
          };
        } catch (error) {
          console.error('❌ Stream error:', error);
          throw error;
        }
      }
    };

    return wrapLanguageModel({
      model: geminiModel,
      middleware: customMiddleware,
    });
  }

  // Otherwise use OpenAI
  return wrapLanguageModel({
    model: openai(apiIdentifier),
    middleware: customMiddleware,
  });
};
