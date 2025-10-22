import { customProvider } from "ai";
import { getModelConfig } from "./model-configs";

// Helper function để gọi API AI agent nội bộ
async function callInternalAI(messages: any[], modelId: string, sessionId?: string) {
  const config = getModelConfig(modelId);
  
  console.log(`[${modelId}] Model config:`, config);

  const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;
  
  // Tạo session ID nếu chưa có
  const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Chuyển đổi messages từ AI SDK format sang format của AI agent nội bộ
  let userMessage = "";
  
  console.log(`[${modelId}] Raw messages:`, JSON.stringify(messages, null, 2));
  console.log(`[${modelId}] Messages type:`, typeof messages);
  console.log(`[${modelId}] Messages is array:`, Array.isArray(messages));
  console.log(`[${modelId}] Messages length:`, messages?.length);
  
  // Kiểm tra và xử lý messages
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
  
  // Debug: Log tất cả messages để hiểu structure
  console.log(`[${modelId}] All messages structure:`, messages.map((msg, index) => ({
    index,
    role: msg.role,
    hasContent: 'content' in msg,
    hasParts: 'parts' in msg,
    contentType: typeof msg.content,
    contentLength: Array.isArray(msg.content) ? msg.content.length : (msg.content ? String(msg.content).length : 0)
  })));
  
  // Lấy message cuối cùng từ user
  const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
  console.log(`[${modelId}] Last user message:`, JSON.stringify(lastUserMessage, null, 2));
  
  if (!lastUserMessage) {
    console.error(`[${modelId}] No user message found in messages`);
    throw new Error("No user message found in conversation");
  }
  
  // Xử lý content dựa trên cấu trúc của AI SDK
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
    // Fallback: nếu có property text trực tiếp
    userMessage = lastUserMessage.text;
  } else if (lastUserMessage.message) {
    // Fallback: nếu có property message trực tiếp
    userMessage = lastUserMessage.message;
  } else {
    console.error(`[${modelId}] Unknown message content structure:`, lastUserMessage);
    console.error(`[${modelId}] Available properties:`, Object.keys(lastUserMessage));
    throw new Error("Unknown message content structure");
  }
  
  console.log(`[${modelId}] Extracted userMessage:`, userMessage);
  
  // Validate user message
  if (!userMessage || userMessage.trim() === '') {
    console.error(`[${modelId}] User message is empty after extraction`);
    throw new Error("User message cannot be empty");
  }

  console.log(`[${modelId}] Sending message to ${apiUrl}:`, {
    userMessage,
    sessionId: currentSessionId,
    config: { serverIP: config.serverIP, port: config.port, assetId: config.assetId, username: config.username, password: config.password }
  });

  // Sử dụng format đúng theo API documentation
  const payload = {
    sessionInfo: {
      sessionId: currentSessionId
    },
    content: userMessage
  };

  console.log(`[${modelId}] Request payload:`, JSON.stringify(payload, null, 2));

  try {
    // Set environment variable để bỏ qua SSL verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Sử dụng headers đã test thành công
    const headers = {
      "Content-Type": "application/json",
      "username": config.username,
      "password": Buffer.from(config.password).toString('base64'),
    };

    console.log(`[${modelId}] Request headers:`, headers);
    
    // Sử dụng fetch mặc định
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    console.log(`[${modelId}] Response status:`, response.status);
    console.log(`[${modelId}] Response ok:`, response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${modelId}] AI Agent API error: ${response.status} ${response.statusText}`, {
        url: apiUrl,
        errorText,
        requestPayload: payload,
        requestHeaders: headers,
        config: { serverIP: config.serverIP, port: config.port, assetId: config.assetId }
      });
      
      // Đặc biệt xử lý lỗi 400 để hiển thị chi tiết
      if (response.status === 400) {
        throw new Error(`Bad Request (400): ${errorText}. Check request format and parameters.`);
      }
      
      throw new Error(`AI Agent API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[${modelId}] AI Agent response:`, data);
    
    // Kiểm tra nếu response có lỗi (format từ test results)
    if (data.content && data.content.includes("Error 704002")) {
      console.error(`[${modelId}] AI Agent returned error:`, data.content);
      throw new Error(`AI Agent error: ${data.content}`);
    }

    // Kiểm tra nếu response có lỗi từ API (format: {'code': -1, 'message': '...'})
    if (data.content && data.content.includes("'code': -1")) {
      console.error(`[${modelId}] AI Agent returned API error:`, data.content);
      throw new Error(`AI Agent API error: ${data.content}`);
    }

    // Kiểm tra nếu không có content
    if (!data.content) {
      console.warn(`[${modelId}] No content in response:`, data);
      return {
        content: "No response content from AI agent",
        sessionId: currentSessionId,
      };
    }

    // Trả về content đã được clean up
    const cleanContent = data.content.trim();
    console.log(`[${modelId}] Cleaned content:`, cleanContent);

    // Không cần extract title nữa vì đã sử dụng message text trực tiếp

    return {
      content: cleanContent,
      sessionId: currentSessionId,
    };
  } catch (error) {
    console.error("Error calling internal AI agent:", error);
    throw new Error(`Failed to connect to internal AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Tạo custom language model cho AI agent nội bộ
const createInternalAIModel = (modelId: string) => {
  return {
    provider: "custom",
    modelId,
    specificationVersion: "v2" as const,
    supportedUrls: {} as Record<string, RegExp[]>,
    
    // Custom implementation cho AI SDK v2
    async doGenerate(options: any) {
      try {
        // AI SDK v2 sử dụng 'prompt' thay vì 'messages'
        const { messages, prompt } = options;
        const messagesToUse = messages || prompt;
        
        console.log(`[${modelId}] doGenerate called with messages:`, messages);
        console.log(`[${modelId}] doGenerate called with prompt:`, prompt);
        console.log(`[${modelId}] Using messagesToUse:`, messagesToUse);
        
        // Debug: Log options để hiểu structure
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
    
    // Hỗ trợ streaming
    async doStream(options: any) {
      try {
        console.log(`[${modelId}] doStream called!`);
        
        // AI SDK v2 sử dụng 'prompt' thay vì 'messages'
        const { messages, prompt } = options;
        const messagesToUse = messages || prompt;
        
        console.log(`[${modelId}] doStream called with messages:`, messages);
        console.log(`[${modelId}] doStream called with prompt:`, prompt);
        console.log(`[${modelId}] Using messagesToUse:`, messagesToUse);
        
        // Debug: Log options để hiểu structure
        console.log(`[${modelId}] doStream options:`, JSON.stringify(options, null, 2));
        
        if (!messagesToUse) {
          console.error(`[${modelId}] Both messages and prompt are null/undefined in doStream`);
          throw new Error("No messages or prompt provided to doStream");
        }
        
        const result = await callInternalAI(messagesToUse, modelId);
        
        console.log(`[${modelId}] Streaming result:`, result);
        
        // Tạo ReadableStream với format đúng cho AI SDK v2
        const stream = new ReadableStream({
          start(controller) {
            console.log(`[${modelId}] Starting stream with content length:`, result.content.length);
            
            // Simulate streaming bằng cách chia response thành chunks nhỏ
            const words = result.content.split(' ');
            const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Gửi text-start event
            controller.enqueue({
              type: "text-start",
              id: streamId,
            });
            
            let index = 0;
            
            const sendNextChunk = () => {
              if (index < words.length) {
                // Gửi từng chunk nhỏ với delta property
                controller.enqueue({
                  type: "text-delta",
                  id: streamId,
                  delta: words[index] + ' ',
                });
                
                index++;
                
                // Gửi chunk tiếp theo sau 50ms để simulate streaming
                setTimeout(sendNextChunk, 50);
              } else {
                // Gửi text-end event khi hoàn thành
                controller.enqueue({
                  type: "text-end",
                  id: streamId,
                });
                
                // Gửi finish event
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
            
            // Bắt đầu streaming
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

// Tạo custom provider
export const internalAIProvider = customProvider({
  languageModels: {
    "npo-yen-model": createInternalAIModel("npo-yen-model"),
    "cs-ai-model": createInternalAIModel("cs-ai-model"),
    "cs-minh-model": createInternalAIModel("cs-minh-model"),
  },
});
