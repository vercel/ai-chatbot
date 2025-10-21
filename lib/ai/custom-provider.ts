import { customProvider } from "ai";

// Cấu hình AI Agent nội bộ
const INTERNAL_AI_CONFIG = {
  serverIP: process.env.INTERNAL_AI_SERVER_IP || "10.196.5.134",
  port: process.env.INTERNAL_AI_PORT || "28001",
  assetId: process.env.INTERNAL_AI_ASSET_ID || "70",
  username: process.env.INTERNAL_AI_USERNAME || "aiteam1",
  password: process.env.INTERNAL_AI_PASSWORD || "Z_tywg_2025",
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
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "username": INTERNAL_AI_CONFIG.username,
        "password": Buffer.from(INTERNAL_AI_CONFIG.password).toString('base64'),
      },
      body: JSON.stringify(payload),
      // Bỏ qua SSL verification cho mạng nội bộ
      // @ts-ignore
      rejectUnauthorized: false,
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
    // Custom implementation cho AI SDK
    async generateText({ messages, system, maxTokens, temperature, topP }) {
      const result = await callInternalAI(messages);
      
      return {
        text: result.content,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: "stop",
      };
    },
    
    // Hỗ trợ streaming (nếu cần)
    async *generateTextStream({ messages, system, maxTokens, temperature, topP }) {
      const result = await callInternalAI(messages);
      
      // Trả về response dưới dạng stream
      yield {
        type: "text-delta",
        textDelta: result.content,
      };
      
      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
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
