import { customProvider } from "ai";

// Cấu hình AI Agent nội bộ
const INTERNAL_AI_CONFIG = {
  serverIP: process.env.INTERNAL_AI_SERVER_IP || "10.196.5.134",
  port: process.env.INTERNAL_AI_PORT || "28001",
  assetId: process.env.INTERNAL_AI_ASSET_ID || "70",
  username: process.env.INTERNAL_AI_USERNAME || "aiteam1",
  password: process.env.INTERNAL_AI_PASSWORD || "AInow123@",
};

// Helper function để gọi API AI agent nội bộ
async function callInternalAI(messages: any[], sessionId?: string) {
  const apiUrl = `https://${INTERNAL_AI_CONFIG.serverIP}:${INTERNAL_AI_CONFIG.port}/api/ifactory-agent-run/v1/chat/api/${INTERNAL_AI_CONFIG.assetId}`;
  
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
        "username": INTERNAL_AI_CONFIG.username,
        "password": Buffer.from(INTERNAL_AI_CONFIG.password).toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI Agent API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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
      const result = await callInternalAI(messages);
      
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
      const result = await callInternalAI(messages);
      
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
    "chat-model": createInternalAIModel("internal-chat-model"),
    "chat-model-reasoning": createInternalAIModel("internal-reasoning-model"),
    "title-model": createInternalAIModel("internal-title-model"),
    "artifact-model": createInternalAIModel("internal-artifact-model"),
  },
});
