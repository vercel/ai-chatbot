import { customProvider } from "ai";
import { getModelConfig } from "./model-configs";

// Helper function để gọi API AI agent nội bộ
async function callInternalAI(messages: any[], modelId: string, sessionId?: string) {
  const config = getModelConfig(modelId);

  const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;
  
  // Tạo session ID nếu chưa có
  const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Chuyển đổi messages từ AI SDK format sang format của AI agent nội bộ
  let userMessage = "";
  if (messages && messages.length > 0) {
    // Lấy message cuối cùng từ user
    const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
    if (lastUserMessage) {
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
      }
    }
  }

  console.log(`[${modelId}] Sending message to ${apiUrl}:`, {
    userMessage,
    sessionId: currentSessionId,
    config: { serverIP: config.serverIP, port: config.port, assetId: config.assetId }
  });

  // Sử dụng format đã test thành công
  const payload = {
    sessionInfo: {
      sessionId: currentSessionId
    },
    contentType: "rich-text",
    content: userMessage
  };

  console.log(`[${modelId}] Request payload:`, JSON.stringify(payload, null, 2));

  // Validate input
  if (!userMessage || userMessage.trim() === '') {
    throw new Error('User message is empty or invalid');
  }

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
        const { messages } = options;
        console.log(`[${modelId}] doGenerate called with messages:`, messages);
        const result = await callInternalAI(messages, modelId);
        
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
        const { messages } = options;
        console.log(`[${modelId}] doStream called with messages:`, messages);
        const result = await callInternalAI(messages, modelId);
        
        // Tạo ReadableStream
        const stream = new ReadableStream({
          start(controller) {
            // Gửi text delta
            controller.enqueue({
              type: "text-delta" as const,
              textDelta: result.content,
            });
            
            // Gửi finish event
            controller.enqueue({
              type: "finish" as const,
              finishReason: "stop" as const,
              usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
              warnings: [],
            });
            
            controller.close();
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
