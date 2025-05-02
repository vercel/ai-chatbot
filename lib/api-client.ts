import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  organizationId: string;
}

export interface OrganizationRequest {
  name: string;
  description: string;
  email?: string;
  password?: string;
}

export interface ChatRequest {
  title: string;
  organizationId: string;
}

export interface MessageRequest {
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
  organizationId: string;
}

export interface MessageReactionRequest {
  messageId: string;
  reaction: string;
  organizationId: string;
}

export interface ShareChatRequest {
  chatId: string;
  sharedWithUserId: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for handling cookies
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Get token from localStorage only on client side
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle specific error cases
        if (error.response?.status === 401) {
          // Handle unauthorized access
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject({
          message: error.response?.data?.message || 'An error occurred',
          status: error.response?.status || 500,
        });
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Authentication APIs
  async  login(data: LoginRequest) {
    const response = await this.client.post('/api/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async register(data: RegisterRequest) {
    const response = await this.client.post('/api/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async guestLogin() {
    const response = await this.client.post('/api/auth/guest');
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  // Organization APIs
  async createOrganization(data: OrganizationRequest) {
    const response = await this.client.post('/api/organizations', data);
    return response.data;
  }

  async getOrganization() {
    const response = await this.client.get('/api/organizations');
    return response.data;
  }

  async updateOrganization(data: Partial<OrganizationRequest>) {
    const response = await this.client.put('/api/organizations', data);
    return response.data;
  }

  async deleteOrganization() {
    const response = await this.client.delete('/api/organizations');
    return response.data;
  }

  // Chat APIs
  async createChat(data: ChatRequest) {
    const response = await this.client.post('/api/chats', data);
    return response.data;
  }

  async getChat(id: string) {
    const response = await this.client.get(`/api/chats/${id}`);
    return response.data;
  }

  async getChatMessages(chatId: string, organizationId: string) {
    const response = await this.client.get(`/api/chats/${chatId}/messages`, {
      params: { organizationId },
    });
    return response.data;
  }

  async shareChat(data: ShareChatRequest) {
    const response = await this.client.post('/api/chats/share', data);
    return response.data;
  }

  async getSharedChats() {
    const response = await this.client.get('/api/chats/shared');
    return response.data;
  }

  // Message APIs
  async createMessage(data: MessageRequest) {
    const response = await this.client.post('/api/messages', data);
    return response.data;
  }

  async getMessage(id: string, organizationId: string) {
    const response = await this.client.get(`/api/messages/${id}`, {
      params: { organizationId },
    });
    return response.data;
  }

  async updateMessage(id: string, content: string, organizationId: string) {
    const response = await this.client.put(`/api/messages/${id}`, { content }, {
      params: { organizationId },
    });
    return response.data;
  }

  async deleteMessage(id: string, organizationId: string) {
    const response = await this.client.delete(`/api/messages/${id}`, {
      params: { organizationId },
    });
    return response.data;
  }

  // Message Reaction APIs
  async getMessageReactions(messageId: string, organizationId: string) {
    const response = await this.client.get(`/api/message-reactions/message/${messageId}`, {
      params: { organizationId },
    });
    return response.data;
  }

  async getMyReactions(organizationId: string) {
    const response = await this.client.get('/api/message-reactions/my-reactions', {
      params: { organizationId },
    });
    return response.data;
  }

  async getReaction(id: string) {
    const response = await this.client.get(`/api/message-reactions/${id}`);
    return response.data;
  }

  async addReaction(data: MessageReactionRequest) {
    const response = await this.client.post('/api/message-reactions', data);
    return response.data;
  }

  async removeReaction(id: string) {
    const response = await this.client.delete(`/api/message-reactions/${id}`);
    return response.data;
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance(); 