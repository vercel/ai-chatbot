import { customProvider } from "ai";
import { getModelConfig } from "./model-configs";

async function callInternalAI(messages: any[], modelId: string, sessionId?: string) {
  const config = getModelConfig(modelId);
  
  const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;
  
  const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let userMessage = "";
  
  if (!messages) {
    console.error(`[${modelId}] Messages is null or undefined`);
    throw new Error("No messages provided to AI model");
  }
  
  if (!Array.isArray(messages)) {
    console.error(`[${modelId}] Messages is not an array:`, typeof messages);
    throw new Error("Messages must be an array");
  }
  
  if (messages.length === 0) {
    console.error(`[${modelId}] Messages array is empty`);
    throw new Error("Messages array is empty");
  }
  
  const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
  
  if (!lastUserMessage) {
    console.error(`[${modelId}] No user message found in messages`);
    throw new Error("No user message found in conversation");
  }
  
  if (typeof lastUserMessage.content === 'string') {
    userMessage = lastUserMessage.content;
  } else if (Array.isArray(lastUserMessage.content)) {
    userMessage = lastUserMessage.content.map((part: any) => {
      if (typeof part === 'string') return part;
      if (part.text) return part.text;
      if (part.content) return part.content;
      return String(part);
    }).join(' ');
  } else if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
    userMessage = lastUserMessage.parts.map((part: any) => {
      if (typeof part === 'string') return part;
      if (part.text) return part.text;
      if (part.content) return part.content;
      return String(part);
    }).join(' ');
  } else if (lastUserMessage.text) {
    userMessage = lastUserMessage.text;
  } else if (lastUserMessage.message) {
    userMessage = lastUserMessage.message;
  } else {
    console.error(`[${modelId}] Unknown message content structure:`, lastUserMessage);
    throw new Error("Unknown message content structure");
  }
  
  if (!userMessage || userMessage.trim() === '') {
    console.error(`[${modelId}] User message is empty after extraction`);
    throw new Error("User message cannot be empty");
  }

  const payload = {
    sessionInfo: {
      sessionId: currentSessionId
    },
    content: userMessage
  };

  console.log(`[${modelId}] Request payload:`, JSON.stringify(payload, null, 2));

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const headers = {
      "Content-Type": "application/json",
      "username": config.username,
      "password": Buffer.from(config.password).toString('base64'),
    };

    console.log(`[${modelId}] Request headers:`, headers);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${modelId}] AI Agent API error: ${response.status} ${response.statusText}`, {
        url: apiUrl,
        errorText
      });
     
      if (response.status === 400) {
        throw new Error(`Bad Request (400): ${errorText}. Check request format and parameters.`);
      }
      
      throw new Error(`AI Agent API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.content && data.content.includes("Error 704002")) {
      console.error(`[${modelId}] AI Agent returned error:`, data.content);
      throw new Error(`AI Agent error: ${data.content}`);
    }

    if (data.content && data.content.includes("'code': -1")) {
      console.error(`[${modelId}] AI Agent returned API error:`, data.content);
      throw new Error(`AI Agent API error: ${data.content}`);
    }

    if (!data.content) {
      console.warn(`[${modelId}] No content in response:`, data);
      return {
        content: "No response content from AI agent",
        sessionId: currentSessionId,
      };
    }

    const cleanContent = data.content.trim();
    console.log(`[${modelId}] Cleaned content:`, cleanContent);

    return {
      content: cleanContent,
      sessionId: currentSessionId,
    };
  } catch (error) {
    console.error("Error calling internal AI agent:", error);
    throw new Error(`Failed to connect to internal AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const createInternalAIModel = (modelId: string) => {
  return {
    provider: "custom",
    modelId,
    specificationVersion: "v2" as const,
    supportedUrls: {} as Record<string, RegExp[]>,
    
    async doGenerate(options: any) {
      try {
        const { messages, prompt } = options;
        const messagesToUse = messages || prompt;
        
        console.log(`[${modelId}] doGenerate called with messages:`, messages);
        console.log(`[${modelId}] doGenerate called with prompt:`, prompt);
        console.log(`[${modelId}] Using messagesToUse:`, messagesToUse);
        
        console.log(`[${modelId}] doGenerate options:`, JSON.stringify(options, null, 2));
        
        if (!messagesToUse) {
          console.error(`[${modelId}] Both messages and prompt are null/undefined in doGenerate`);
          throw new Error("No messages or prompt provided to doGenerate");
        }
        
        const result = await callInternalAI(messagesToUse, modelId);
        
        return {
          content: [{ type: "text" as const, text: result.content }],
          finishReason: "stop" as const,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
          warnings: [],
        };
      } catch (error) {
        console.error(`[${modelId}] doGenerate error:`, error);
        throw error;
      }
    },
    
    async doStream(options: any) {
      try {
        console.log(`[${modelId}] doStream called!`);
        
        const { messages, prompt } = options;
        const messagesToUse = messages || prompt;
        
        console.log(`[${modelId}] doStream called with messages:`, messages);
        console.log(`[${modelId}] doStream called with prompt:`, prompt);
        console.log(`[${modelId}] Using messagesToUse:`, messagesToUse);
        
        console.log(`[${modelId}] doStream options:`, JSON.stringify(options, null, 2));
        
        if (!messagesToUse) {
          console.error(`[${modelId}] Both messages and prompt are null/undefined in doStream`);
          throw new Error("No messages or prompt provided to doStream");
        }
        
        const result = await callInternalAI(messagesToUse, modelId);
        
        console.log(`[${modelId}] Streaming result:`, result);
        
        const stream = new ReadableStream({
          start(controller) {
            console.log(`[${modelId}] Starting stream with content length:`, result.content.length);
            
            const words = result.content.split(' ');
            const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            controller.enqueue({
              type: "text-start",
              id: streamId,
            });
            
            let index = 0;
            
            const sendNextChunk = () => {
              if (index < words.length) {
                controller.enqueue({
                  type: "text-delta",
                  id: streamId,
                  delta: words[index] + ' ',
                });
                
                index++;
                
                setTimeout(sendNextChunk, 50);
              } else {
                controller.enqueue({
                  type: "text-end",
                  id: streamId,
                });
                
                controller.enqueue({
                  type: "finish",
                  finishReason: "stop",
                  usage: {
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                  },
                });
                controller.close();
              }
            };
            
            sendNextChunk();
          },
        });
        
        return {
          stream,
        };
      } catch (error) {
        console.error(`[${modelId}] doStream error:`, error);
        throw error;
      }
    },
  };
};

export const internalAIProvider = customProvider({
  languageModels: {
    "npo-yen-model": createInternalAIModel("npo-yen-model"),
    "cs-ai-model": createInternalAIModel("cs-ai-model"),
    "cs-minh-model": createInternalAIModel("cs-minh-model"),
  },
});
