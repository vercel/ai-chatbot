/**
 * Mock Service Worker (MSW) setup for API mocking
 * Provides controlled HTTP response mocking for tests
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API handlers
const handlers = [
  // Auth API mocks
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/auth/guest', () => {
    return HttpResponse.json({
      user: {
        id: 'guest-user-id',
        email: 'guest-12345-abcd@localhost',
        name: 'Guest User ABC123',
        isGuest: true,
      },
      token: 'mock-guest-token',
    });
  }),

  // Claude AI API mocks
  http.post('/api/claude/sdk', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.stream) {
      // Mock streaming response
      return new HttpResponse(
        'data: {"type":"text_chunk","content":"Hello"}\ndata: {"type":"text_chunk","content":" there!"}\ndata: {"type":"done"}\n',
        {
          headers: {
            'Content-Type': 'text/event-stream',
          },
        }
      );
    }

    // Mock regular response
    return HttpResponse.json({
      content: `Response to: ${body.messages[body.messages.length - 1]?.content || 'unknown'}`,
      sessionId: body.sessionId || 'mock-session-id',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
      metadata: {
        provider: 'claude-sdk',
        model: 'claude-3-sonnet',
      },
    });
  }),

  http.get('/api/claude/sdk/health', () => {
    return HttpResponse.json({ status: 'healthy' });
  }),

  http.post('/api/claude-chat', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      content: `Chat response: ${body.messages[body.messages.length - 1]?.content || 'unknown'}`,
      sessionId: body.sessionId || 'mock-chat-session',
    });
  }),

  http.post('/api/claude-main', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      content: `Main response with MCP: ${body.messages[body.messages.length - 1]?.content || 'unknown'}`,
      sessionId: body.sessionId || 'mock-main-session',
      metadata: {
        mcpEnabled: body.enableMCP,
      },
    });
  }),

  // Artifacts API mocks
  http.get('/api/artifacts', () => {
    return HttpResponse.json([
      {
        id: 'artifact-1',
        title: 'Test Artifact 1',
        content: 'console.log("Hello, World!");',
        type: 'code',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        userId: 'test-user',
      },
      {
        id: 'artifact-2',
        title: 'Test Artifact 2',
        content: '# Hello World\n\nThis is markdown.',
        type: 'markdown',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        userId: 'test-user',
      },
    ]);
  }),

  http.post('/api/artifacts', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `artifact-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),

  http.get('/api/artifacts/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: `Artifact ${params.id}`,
      content: 'Mock content',
      type: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),

  // Upload API mocks
  http.post('/api/upload', () => {
    return HttpResponse.json({
      url: '/mock-uploads/file.txt',
      filename: 'file.txt',
      size: 1024,
      type: 'text/plain',
    });
  }),

  // Rate limiting test endpoints
  http.get('/api/test-rate-limit', () => {
    return HttpResponse.json({ message: 'Request allowed' });
  }),

  // Health check endpoints
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        ai: 'healthy',
      },
    });
  }),

  // Error scenarios for testing
  http.get('/api/error/500', () => {
    return new HttpResponse('Internal Server Error', { status: 500 });
  }),

  http.get('/api/error/404', () => {
    return new HttpResponse('Not Found', { status: 404 });
  }),

  http.get('/api/error/timeout', async () => {
    // Simulate slow response
    await new Promise(resolve => setTimeout(resolve, 10000));
    return HttpResponse.json({ message: 'Slow response' });
  }),

  // Admin API mocks
  http.get('/api/admin/users', () => {
    return HttpResponse.json([
      { id: '1', email: 'admin@example.com', role: 'admin' },
      { id: '2', email: 'user@example.com', role: 'user' },
    ]);
  }),

  http.get('/api/admin/stats', () => {
    return HttpResponse.json({
      totalUsers: 150,
      totalArtifacts: 1200,
      activeUsers: 45,
      systemLoad: 0.65,
    });
  }),
];

// Create and export the server
export const server = setupServer(...handlers);

// Helper function to add custom handlers during tests
export const addHandler = (...newHandlers: Parameters<typeof http.get>) => {
  server.use(...newHandlers as any[]);
};

// Helper function to reset to default handlers
export const resetHandlers = () => {
  server.resetHandlers(...handlers);
};

// Helper function to simulate network errors
export const simulateNetworkError = (url: string) => {
  server.use(
    http.get(url, () => {
      throw new Error('Network error');
    }),
    http.post(url, () => {
      throw new Error('Network error');
    })
  );
};

// Helper function to simulate slow responses
export const simulateSlowResponse = (url: string, delay: number = 5000) => {
  server.use(
    http.get(url, async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({ message: 'Delayed response' });
    })
  );
};

export default server;