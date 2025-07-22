import { MemoryClient } from 'mem0ai';

export interface MemoryRecord {
  id: string;
  memory: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AddMemoryRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  metadata?: Record<string, any>;
  user_id: string;
}

export interface SearchMemoryRequest {
  query: string;
  user_id?: string;
  limit?: number;
  filters?: Record<string, any>;
}

export class Mem0ProjectClient {
  private client: MemoryClient;
  private orgId?: string;

  constructor(apiKey?: string, orgId?: string) {
    const key = apiKey || process.env.MEM0_API_KEY;
    this.orgId = orgId || process.env.MEM0_ORG_ID;

    if (!key) {
      throw new Error('MEM0_API_KEY is required for platform usage');
    }

    this.client = new MemoryClient({
      apiKey: key,
    });
  }

  // Project Management
  async createProject(name: string, description?: string): Promise<any> {
    if (!this.orgId) {
      throw new Error(
        'Organization ID is required for project operations. Set MEM0_ORG_ID environment variable or pass orgId to constructor.',
      );
    }

    // Using direct fetch since the MemoryClient might not expose project methods
    const response = await fetch(
      `https://api.mem0.ai/api/v1/orgs/organizations/${this.orgId}/projects/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.MEM0_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProjects(): Promise<any[]> {
    if (!this.orgId) {
      throw new Error(
        'Organization ID is required for project operations. Set MEM0_ORG_ID environment variable or pass orgId to constructor.',
      );
    }

    const response = await fetch(
      `https://api.mem0.ai/api/v1/orgs/organizations/${this.orgId}/projects/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Token ${process.env.MEM0_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProject(projectId: string): Promise<any> {
    if (!this.orgId) {
      throw new Error(
        'Organization ID is required for project operations. Set MEM0_ORG_ID environment variable or pass orgId to constructor.',
      );
    }

    const response = await fetch(
      `https://api.mem0.ai/api/v1/orgs/organizations/${this.orgId}/projects/${projectId}/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Token ${process.env.MEM0_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get project: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!this.orgId) {
      throw new Error(
        'Organization ID is required for project operations. Set MEM0_ORG_ID environment variable or pass orgId to constructor.',
      );
    }

    const response = await fetch(
      `https://api.mem0.ai/api/v1/orgs/organizations/${this.orgId}/projects/${projectId}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${process.env.MEM0_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.statusText}`);
    }
  }

  // Memory Management
  async addMemory(request: AddMemoryRequest): Promise<any> {
    const response = await this.client.add(request.messages, {
      user_id: request.user_id,
      metadata: request.metadata,
    });
    return response;
  }

  // Add memory specifically to a project
  async addProjectMemory(
    projectId: string,
    request: AddMemoryRequest,
  ): Promise<any> {
    // Use the standard memories endpoint with project_id and org_id
    const response = await fetch('https://api.mem0.ai/v1/memories/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages,
        user_id: request.user_id,
        org_id: this.orgId,
        project_id: projectId,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to add project memory: ${response.statusText} - ${errorText}`,
      );
    }

    return await response.json();
  }

  async searchMemories(request: SearchMemoryRequest): Promise<any[]> {
    const response = await this.client.search(request.query, {
      user_id: request.user_id,
      limit: request.limit || 10,
      filters: request.filters,
    });

    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    return [];
  }

  async getMemory(memoryId: string): Promise<any | null> {
    try {
      return await this.client.get(memoryId);
    } catch (error) {
      if ((error as any)?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateMemory(
    memoryId: string,
    data: { text?: string; metadata?: Record<string, any> },
  ): Promise<any> {
    const response = await fetch(
      `https://api.mem0.ai/api/v1/memories/${memoryId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${process.env.MEM0_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update memory: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await this.client.delete(memoryId);
  }

  async getAllMemories(userId?: string): Promise<any[]> {
    const response = await this.client.getAll({
      user_id: userId,
    });
    return Array.isArray(response) ? response : [];
  }

  // Project-specific memory methods
  async getProjectMemories(projectId: string, userId?: string): Promise<any[]> {
    console.log('🔧 client.getProjectMemories: Starting with params:', {
      projectId,
      userId,
    });

    // Use the v2 memories endpoint
    const url = new URL('https://api.mem0.ai/v2/memories/');

    // The v2 API requires filters to be provided
    // We'll use a created_at filter that includes all memories
    const requestBody: any = {
      filters: {
        created_at: {
          gte: '2025-01-01T00:00:00Z', // Get all memories created after Jan 1, 2025
        },
      },
      org_id: this.orgId,
      project_id: projectId, // Pass project_id in the request body
    };

    // If userId is provided, add it to the filters
    if (userId) {
      requestBody.filters.user_id = userId;
    }

    const finalUrl = url.toString();
    console.log('🔧 client.getProjectMemories: API URL:', finalUrl);
    console.log(
      '🔧 client.getProjectMemories: Request body:',
      JSON.stringify(requestBody, null, 2),
    );
    console.log('🔧 client.getProjectMemories: Making fetch request...');

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      '🔧 client.getProjectMemories: Response status:',
      response.status,
    );
    console.log(
      '🔧 client.getProjectMemories: Response statusText:',
      response.statusText,
    );
    console.log(
      '🔧 client.getProjectMemories: Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(
        '❌ client.getProjectMemories: Error response body:',
        errorText,
      );
      throw new Error(
        `Failed to get project memories: ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log(
      '🔧 client.getProjectMemories: Raw API response:',
      JSON.stringify(data, null, 2),
    );

    const result = Array.isArray(data)
      ? data
      : data.memories || data.results || [];
    console.log(
      '🔧 client.getProjectMemories: Processed result:',
      JSON.stringify(result, null, 2),
    );

    return result;
  }

  async searchProjectMemories(
    projectId: string,
    request: SearchMemoryRequest,
  ): Promise<any[]> {
    console.log('🔧 client.searchProjectMemories: Starting with params:', {
      projectId,
      request,
    });

    // Use the v2 search endpoint
    const url = new URL('https://api.mem0.ai/v2/memories/search/');

    const requestBody: any = {
      query: request.query,
      top_k: request.limit || 10,
      filters: {
        // Always include created_at filter as the API requires filters
        created_at: {
          gte: '2025-01-01T00:00:00Z', // Get all memories created after Jan 1, 2025
        },
      },
      org_id: this.orgId,
      project_id: projectId, // Pass project_id in the request body
    };

    // Add user_id filter if provided
    if (request.user_id) {
      requestBody.filters.user_id = request.user_id;
    }

    // Merge additional filters if provided
    if (request.filters) {
      Object.assign(requestBody.filters, request.filters);
    }

    const finalUrl = url.toString();
    console.log('🔧 client.searchProjectMemories: API URL:', finalUrl);
    console.log(
      '🔧 client.searchProjectMemories: Request body:',
      JSON.stringify(requestBody, null, 2),
    );
    console.log('🔧 client.searchProjectMemories: Making fetch request...');

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      '🔧 client.searchProjectMemories: Response status:',
      response.status,
    );
    console.log(
      '🔧 client.searchProjectMemories: Response statusText:',
      response.statusText,
    );
    console.log(
      '🔧 client.searchProjectMemories: Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(
        '❌ client.searchProjectMemories: Error response body:',
        errorText,
      );
      throw new Error(
        `Failed to search project memories: ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log(
      '🔧 client.searchProjectMemories: Raw API response:',
      JSON.stringify(data, null, 2),
    );

    // Handle different response formats
    let result: any[];
    if (Array.isArray(data)) {
      result = data;
    } else if (data && typeof data === 'object' && 'results' in data) {
      result = data.results || [];
    } else if (data && typeof data === 'object' && 'memories' in data) {
      result = data.memories || [];
    } else {
      result = [];
    }

    console.log(
      '🔧 client.searchProjectMemories: Processed result:',
      JSON.stringify(result, null, 2),
    );
    return result;
  }

  // Utility methods
  getOrgId(): string | undefined {
    return this.orgId;
  }

  setOrgId(orgId: string): void {
    this.orgId = orgId;
  }
}

// Factory function
export function createMem0Client(
  apiKey?: string,
  orgId?: string,
): Mem0ProjectClient {
  return new Mem0ProjectClient(apiKey, orgId);
}

// Default client instance
export const mem0Client = createMem0Client();
