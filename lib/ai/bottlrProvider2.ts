// bottlrProvider.ts
import type {
    LanguageModelV1,
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
  } from 'ai';
  
  /**
   * Creates a bottlr chat language model implementation
   */
  export function bottlrChat(): LanguageModelV1 {
    return {
      // Required properties specified by LanguageModelV1 interface
      specificationVersion: 'v1',
      provider: 'bottlr',
      modelId: 'bottlr-backend',
      defaultObjectGenerationMode: undefined, // We don't support object generation
  
      // Implementation of the generate method
      async doGenerate(options: LanguageModelV1CallOptions) {
        const { prompt, abortSignal } = options;
        
        // Extract any custom options that might be passed
        const customData = options.providerMetadata?.bottlr || {};
        
        // Prepare the payload for the bottlr backend
        const payload = {
          messages: prompt.map(message => ({
            role: message.role,
            content: Array.isArray(message.content) 
              ? message.content.map(part => {
                  if (part.type === 'text') {
                    return part.text;
                  }
                  return '';
                }).join('')
              : message.content,
          })),
          stream: false, // Request non-streaming response
          ...customData
        };
        
        console.log("Sending to Bottlr backend:", JSON.stringify(payload, null, 2));
        
        try {
          const response = await fetch('http://nishantbundela.com/api/chat2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add any required authentication headers
            },
            body: JSON.stringify(payload),
            signal: abortSignal,
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
          }
          
          const result = await response.json();
          console.log("Received from Bottlr backend:", JSON.stringify(result, null, 2));
          
          return {
            text: result.text || '',
            finishReason: result.finishReason || 'stop',
            usage: {
              promptTokens: result.usage?.promptTokens || 0,
              completionTokens: result.usage?.completionTokens || 0,
            },
            rawCall: {
              rawPrompt: payload,
              rawSettings: options,
            },
            response: {
              id: result.id,
              timestamp: new Date(),
              modelId: 'bottlr-backend',
            },
          };
        } catch (error) {
          console.error('Error in bottlr chat:', error);
          throw error;
        }
      },
      
      // Implementation of the stream method
      async doStream(options: LanguageModelV1CallOptions) {
        const { prompt, abortSignal } = options;
        
        // Extract any custom options that might be passed
        const customData = options.providerMetadata?.bottlr || {};
        
        // Get the actual body data if provided in the options
        const bodyData = options.providerMetadata?.body || {};
        
        // Prepare the payload for the bottlr backend
        const payload = {
          messages: prompt.map(message => ({
            role: message.role,
            content: Array.isArray(message.content) 
              ? message.content.map(part => {
                  if (part.type === 'text') {
                    return part.text;
                  }
                  return '';
                }).join('')
              : message.content,
          })),
          stream: true, // Request streaming response
          ...bodyData,
          ...customData
        };
        
        console.log("Sending to Bottlr backend (stream):", JSON.stringify(payload, null, 2));
        
        try {
          const response = await fetch('http://nishantbundela.com/api/chat2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add any required authentication headers
            },
            body: JSON.stringify(payload),
            signal: abortSignal,
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
          }
          
          console.log("Got successful response from Bottlr backend");
          
          // Create a stream transformer to convert the SSE stream to LanguageModelV1StreamPart objects
          const stream = response.body!
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(
              new TransformStream<string, LanguageModelV1StreamPart>({
                transform(chunk, controller) {
                  // Log chunks for debugging
                  console.log("Received chunk:", chunk);
                  
                  // Skip empty chunks
                  if (!chunk.trim()) return;
                  
                  // Handle SSE format - lines start with "data: "
                  const lines = chunk
                    .split('\n')
                    .filter(line => line.startsWith('data: '))
                    .map(line => line.slice(6).trim());
                  
                  for (const line of lines) {
                    if (line === '[DONE]') {
                      console.log("Received [DONE] marker");
                      return;
                    }
                    
                    try {
                      const data = JSON.parse(line);
                      console.log("Parsed data:", data);
                      
                      if (data.type === 'text') {
                        controller.enqueue({
                          type: 'text-delta',
                          textDelta: data.value || '',
                        });
                      } else if (data.type === 'metadata') {
                        controller.enqueue({
                          type: 'response-metadata',
                          id: data.id,
                          timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
                          modelId: data.modelId || 'bottlr-backend',
                        });
                      } else if (data.type === 'finish') {
                        controller.enqueue({
                          type: 'finish',
                          finishReason: data.finishReason || 'stop',
                          usage: {
                            promptTokens: data.usage?.promptTokens || 0,
                            completionTokens: data.usage?.completionTokens || 0,
                          },
                        });
                      }
                    } catch (e) {
                      console.error('Error parsing chunk:', e, line);
                      // If parsing fails, just emit the raw text
                      controller.enqueue({
                        type: 'text-delta',
                        textDelta: line,
                      });
                    }
                  }
                },
              })
            );
          
          return {
            stream,
            rawCall: {
              rawPrompt: payload,
              rawSettings: options,
            },
          };
        } catch (error) {
          console.error('Error in bottlr chat stream:', error);
          
          // Create a stream with an error
          const errorStream = new ReadableStream<LanguageModelV1StreamPart>({
            start(controller) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              controller.enqueue({
                type: 'error',
                error: new Error(errorMessage),
              });
              controller.close();
            },
          });
          
          return {
            stream: errorStream,
            rawCall: {
              rawPrompt: payload,
              rawSettings: options,
            },
          };
        }
      },
    };
  }
  
  // Export the bottlr provider
  export const bottlrProvider = bottlrChat();