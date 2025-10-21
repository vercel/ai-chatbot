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
      userMessage = typeof lastUserMessage.content === 'string' 
        ? lastUserMessage.content 
        : lastUserMessage.content.map((part: any) => part.text || part).join(' ');
    }
  }

  const payload = {
    sessionInfo: {
      sessionId: currentSessionId
    },
    contentType: "rich-text",
    content: userMessage
  };

  try {
    // Set environment variable để bỏ qua SSL verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Sử dụng fetch mặc định
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "username": config.username,
        "password": Buffer.from(config.password).toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Agent API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`AI Agent API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Kiểm tra nếu response có lỗi
    if (data.code && data.code !== 0) {
      console.error("AI Agent returned error:", data);
      throw new Error(`AI Agent error: ${data.message || 'Unknown error'}`);
    }

    return {
      content: data.content || "No response from AI agent",
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
      const { messages } = options;
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
    },
    
    // Hỗ trợ streaming
    async doStream(options: any) {
      const { messages } = options;
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
