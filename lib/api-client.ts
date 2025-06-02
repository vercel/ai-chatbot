import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  OrganizationRequest,
  ChatRequest,
  MessageRequest,
  ShareChatRequest,
  DocumentRequest,
  SuggestionRequest,
  ApiError,
  ApiResponse
} from './api-client.types';

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
      withCredentials: true,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
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
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
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
  async login(data: LoginRequest) {
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

  async getMe() {
    const response = await this.client.get('/api/auth/me');
    return response.data;
  }

  async updateMe(data: { name?: string; email?: string }) {
    const response = await this.client.put('/api/auth/me', data);
    return response.data;
  }

  // Organization APIs
  async createOrganization(data: OrganizationRequest) {
    const response = await this.client.post('/api/organizations', data);
    return response.data;
  }

  async getOrganization(id: string) {
    const response = await this.client.get(`/api/organizations/${id}`);
    return response.data;
  }

  async updateOrganization(id: string, data: Partial<OrganizationRequest>) {
    const response = await this.client.put(`/api/organizations/${id}`, data);
    return response.data;
  }

  async deleteOrganization(id: string) {
    const response = await this.client.delete(`/api/organizations/${id}`);
    return response.data;
  }

  // Chat APIs
  async createChat(data: ChatRequest) {
    const response = await this.client.post('/api/chats', data);
    return response.data;
  }

  async uploadFile(file: File, chatId: string): Promise<{
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType: string;
    contentDisposition: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    

    const response = await this.client.post('/api/chats/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async getChats() {
    const response = await this.client.get('/api/chats');
    return response.data;
  }

  async getPaginatedChats(params: { page: number; limit: number; ending_before?: string }) {
    const response = await this.client.get('/api/chats/paginated', { params });
    return response.data;
  }

  async getChat(id: string) {
    const response = await this.client.get(`/api/chats/${id}`);
    return response.data;
  }

  async deleteChat(id: string) {
    const response = await this.client.delete(`/api/chats/${id}`);
    return response.data;
  }

  async createMessageInChat(chatId: string, data: Omit<MessageRequest, 'chatId'>) {
    const response = await this.client.post(`/api/chats/${chatId}/messages`, data);
    return response.data;
  }

  async getMessagesInChat(chatId: string) {
    const response = await this.client.get(`/api/chats/${chatId}/messages`);
    return response.data;
  }

  async updateChatVisibility(chatId: string, data: { isVisible: boolean }) {
    const response = await this.client.put(`/api/chats/${chatId}/visibility`, data);
    return response.data;
  }

  // Message APIs
  async getMessagesByChat(chatId: string, organizationId: string) {
    const response = await this.client.get(`/api/messages/chats/${chatId}/messages`, {
      params: { organizationId }
    });
    return response.data;
  }

  async getMessage(id: string, organizationId: string) {
    const response = await this.client.get(`/api/messages/messages/${id}`, {
      params: { organizationId }
    });
    return response.data;
  }

  async createMessage(data: MessageRequest) {
    const response = await this.client.post('/api/messages/messages', data);
    return response.data;
  }

  async updateMessage(id: string, data: { content: string }, organizationId: string) {
    const response = await this.client.put(`/api/messages/messages/${id}`, data, {
      params: { organizationId }
    });
    return response.data;
  }

  async deleteMessage(id: string, organizationId: string) {
    const response = await this.client.delete(`/api/messages/messages/${id}`, {
      params: { organizationId }
    });
    return response.data;
  }

  async deleteMessagesAfterTimestamp(chatId: string, timestamp: number, organizationId: string) {
    const response = await this.client.delete(`/api/messages/chats/${chatId}/messages/after`, {
      params: { timestamp, organizationId }
    });
    return response.data;
  }

  async getMessageCountByUser(userId: string, organizationId: string) {
    const response = await this.client.get(`/api/messages/users/${userId}/messages/count`, {
      params: { organizationId }
    });
    return response.data;
  }

  // Document APIs
  async getAllDocuments() {
    const response = await this.client.get('/api/documents');
    return response.data;
  }

  async getDocumentById(id: string) {
    const response = await this.client.get(`/api/documents/${id}`);
    return response.data;
  }

  async createDocument(data: DocumentRequest) {
    const response = await this.client.post('/api/documents', data);
    return response.data;
  }

  async updateDocument(id: string, data: Partial<DocumentRequest>) {
    const response = await this.client.put(`/api/documents/${id}`, data);
    return response.data;
  }

  async deleteDocument(id: string) {
    const response = await this.client.delete(`/api/documents/${id}`);
    return response.data;
  }

  async getDocumentsByUser(userId: string) {
    const response = await this.client.get(`/api/documents/user/${userId}`);
    return response.data;
  }

  async getDocumentsByKind(kind: string) {
    const response = await this.client.get(`/api/documents/kind/${kind}`);
    return response.data;
  }

  async getDocumentVersions(id: string) {
    const response = await this.client.get(`/api/documents/${id}/versions`);
    return response.data;
  }

  async deleteDocumentsAfterTimestamp(id: string, timestamp: number) {
    const response = await this.client.delete(`/api/documents/${id}/after`, {
      params: { timestamp }
    });
    return response.data;
  }

  // Suggestion APIs
  async getAllSuggestions() {
    const response = await this.client.get('/api/suggestions');
    return response.data;
  }

  async getSuggestionById(id: string) {
    const response = await this.client.get(`/api/suggestions/${id}`);
    return response.data;
  }

  async saveSuggestions(data: SuggestionRequest) {
    const response = await this.client.post('/api/suggestions', data);
    return response.data;
  }

  async getSuggestionsByDocument(documentId: string) {
    const response = await this.client.get(`/api/suggestions/document/${documentId}`);
    return response.data;
  }

  async getSuggestionsByUser(userId: string) {
    const response = await this.client.get(`/api/suggestions/user/${userId}`);
    return response.data;
  }

  async getUnresolvedSuggestions() {
    const response = await this.client.get('/api/suggestions/unresolved');
    return response.data;
  }

  async updateSuggestionStatus(id: string, data: { status: string }) {
    const response = await this.client.patch(`/api/suggestions/${id}/status`, data);
    return response.data;
  }

  async deleteSuggestion(id: string) {
    const response = await this.client.delete(`/api/suggestions/${id}`);
    return response.data;
  }

  // Vote APIs
  async getVotesByMessage(chatId: string, messageId: string) {
    const response = await this.client.get(`/api/votes/message/${chatId}/${messageId}`);
    return response.data;
  }

  async getVotesByChat(chatId: string) {
    const response = await this.client.get(`/api/votes/chat/${chatId}`);
    return response.data;
  }

  async addReaction(chatId: string, messageId: string, data: { reaction: string }) {
    const response = await this.client.post(`/api/votes/reaction/${chatId}/${messageId}`, data);
    return response.data;
  }

  async removeReaction(chatId: string, messageId: string) {
    const response = await this.client.delete(`/api/votes/reaction/${chatId}/${messageId}`);
    return response.data;
  }

  async toggleVote(chatId: string, messageId: string) {
    const response = await this.client.post(`/api/votes/toggle/${chatId}/${messageId}`);
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();