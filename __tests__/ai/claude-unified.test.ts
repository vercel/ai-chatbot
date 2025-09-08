/**
 * Test Suite: Claude Unified AI Integration
 * Tests the unified Claude AI abstraction layer and provider management
 * 
 * Coverage Areas:
 * - Provider management and switching
 * - Chat and streaming functionality
 * - Error handling and fallback
 * - Health monitoring
 * - Message validation
 * - Provider-specific implementations
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  ClaudeUnified,
  claudeUnified,
  chat,
  streamChat,
  setProvider,
  getAvailableProviders,
  healthCheck,
  type Message,
  type ChatRequest,
  type ChatResponse,
  type StreamChunk,
} from '@/lib/ai/claude-unified';

// Mock fetch globally
global.fetch = jest.fn();

// Mock dependencies
jest.mock('@/lib/config/app-config', () => ({
  appConfig: {
    isFeatureEnabled: jest.fn().mockReturnValue(true),
    get: jest.fn().mockReturnValue({
      ai: {
        defaultProvider: 'claude-sdk',
      },
    }),
  },
}));

describe('Claude Unified AI Integration', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockClear();
    
    // Reset app config
    const { appConfig } = require('@/lib/config/app-config');
    appConfig.isFeatureEnabled.mockReturnValue(true);
    appConfig.get.mockReturnValue({
      ai: {
        defaultProvider: 'claude-sdk',
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = claudeUnified;
      const instance2 = claudeUnified;
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ClaudeUnified);
    });

    it('should initialize with registered providers', () => {
      expect(claudeUnified).toBeDefined();
    });
  });

  describe('Provider Management', () => {
    describe('setProvider', () => {
      it('should set valid provider', () => {
        expect(() => setProvider('claude-chat')).not.toThrow();
        expect(() => setProvider('claude-main')).not.toThrow();
        expect(() => setProvider('claude-sdk')).not.toThrow();
      });

      it('should throw error for invalid provider', () => {
        expect(() => setProvider('invalid-provider')).toThrow('Provider invalid-provider não encontrado');
      });

      it('should update current provider', () => {
        setProvider('claude-chat');
        // Verify by checking behavior (would need internal access)
        expect(() => setProvider('claude-chat')).not.toThrow();
      });
    });

    describe('getAvailableProviders', () => {
      beforeEach(() => {
        fetchMock.mockResolvedValue(
          new Response('OK', { status: 200 })
        );
      });

      it('should return list of available providers', async () => {
        const providers = await getAvailableProviders();
        
        expect(Array.isArray(providers)).toBe(true);
        expect(providers.length).toBeGreaterThan(0);
      });

      it('should check provider availability', async () => {
        await getAvailableProviders();
        
        // Should have called health endpoints
        expect(fetchMock).toHaveBeenCalled();
      });

      it('should handle provider health check failures', async () => {
        fetchMock.mockRejectedValue(new Error('Network error'));
        
        const providers = await getAvailableProviders();
        
        // claude-chat should always be available as fallback
        expect(providers).toContain('claude-chat');
      });
    });

    describe('healthCheck', () => {
      it('should check all provider health', async () => {
        fetchMock.mockResolvedValue(
          new Response('OK', { status: 200 })
        );

        const health = await healthCheck();
        
        expect(health).toMatchObject({
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
          providers: expect.objectContaining({
            'claude-sdk': expect.any(Boolean),
            'claude-chat': expect.any(Boolean),
            'claude-main': expect.any(Boolean),
          }),
        });
      });

      it('should return healthy when all providers available', async () => {
        fetchMock.mockResolvedValue(
          new Response('OK', { status: 200 })
        );

        const health = await healthCheck();
        expect(health.status).toBe('healthy');
      });

      it('should return degraded when some providers unavailable', async () => {
        fetchMock
          .mockResolvedValueOnce(new Response('OK', { status: 200 })) // claude-sdk health
          .mockRejectedValueOnce(new Error('Network error'))           // claude-main health
          .mockResolvedValueOnce(new Response('OK', { status: 200 })); // Always available

        const health = await healthCheck();
        expect(health.status).toBe('degraded');
      });

      it('should return unhealthy when no providers available', async () => {
        fetchMock.mockRejectedValue(new Error('All providers down'));
        
        // Mock claude-chat to also fail (unusual case)
        const { appConfig } = require('@/lib/config/app-config');
        appConfig.isFeatureEnabled.mockReturnValue(false);

        const health = await healthCheck();
        expect(health.status).toBe('unhealthy');
      });
    });
  });

  describe('Message Validation', () => {
    const validMessages: Message[] = [
      {
        role: 'user',
        content: 'Hello, Claude!',
      },
      {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date(),
      },
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
    ];

    const invalidMessages = [
      {
        role: 'invalid',
        content: 'Test',
      },
      {
        role: 'user',
        // missing content
      },
      {
        content: 'Missing role',
      },
    ];

    it('should validate valid messages', () => {
      const request: ChatRequest = {
        messages: validMessages,
      };
      
      expect(() => chat(request)).not.toThrow();
    });

    it('should reject invalid message roles', async () => {
      const request = {
        messages: invalidMessages,
      } as ChatRequest;
      
      await expect(chat(request)).rejects.toThrow();
    });

    it('should validate chat request schema', async () => {
      const validRequest: ChatRequest = {
        messages: validMessages,
        sessionId: 'test-session-123',
        provider: 'claude-sdk',
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          stream: false,
          tools: ['search'],
        },
      };
      
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({
          content: 'Test response',
          sessionId: 'test-session-123',
        }), { status: 200 })
      );
      
      await expect(chat(validRequest)).resolves.toBeDefined();
    });

    it('should validate optional fields', async () => {
      const minimalRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      };
      
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({
          content: 'Test response',
        }), { status: 200 })
      );
      
      await expect(chat(minimalRequest)).resolves.toBeDefined();
    });
  });

  describe('Chat Functionality', () => {
    const testRequest: ChatRequest = {
      messages: [
        { role: 'user', content: 'Hello, Claude!' },
      ],
      sessionId: 'test-session',
    };

    describe('non-streaming chat', () => {
      it('should send chat request and return response', async () => {
        const mockResponse: ChatResponse = {
          content: 'Hello! How can I help you today?',
          sessionId: 'test-session',
          usage: {
            inputTokens: 10,
            outputTokens: 15,
            totalTokens: 25,
          },
          metadata: {
            provider: 'claude-sdk',
            model: 'claude-3-sonnet',
          },
        };

        fetchMock.mockResolvedValue(
          new Response(JSON.stringify(mockResponse), { status: 200 })
        );

        const response = await chat(testRequest);

        expect(response).toEqual(mockResponse);
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude/sdk',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: testRequest.messages,
              sessionId: testRequest.sessionId,
            }),
          })
        );
      });

      it('should handle API errors gracefully', async () => {
        fetchMock.mockResolvedValue(
          new Response('Internal Server Error', { status: 500 })
        );

        await expect(chat(testRequest)).rejects.toThrow('Claude SDK error: Internal Server Error');
      });

      it('should use specified provider', async () => {
        const requestWithProvider: ChatRequest = {
          ...testRequest,
          provider: 'claude-main',
        };

        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ content: 'Response' }), { status: 200 })
        );

        await chat(requestWithProvider);

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude-main',
          expect.any(Object)
        );
      });

      it('should fallback to claude-chat on provider failure', async () => {
        setProvider('claude-sdk');
        
        fetchMock
          .mockResolvedValueOnce(new Response('Server Error', { status: 500 })) // claude-sdk fails
          .mockResolvedValueOnce(new Response(JSON.stringify({               // claude-chat succeeds
            content: 'Fallback response',
            sessionId: 'test-session',
          }), { status: 200 }));

        const response = await chat(testRequest);

        expect(response.content).toBe('Fallback response');
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      it('should pass through options', async () => {
        const requestWithOptions: ChatRequest = {
          ...testRequest,
          options: {
            temperature: 0.8,
            maxTokens: 2000,
            tools: ['search', 'calculator'],
          },
        };

        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ content: 'Response' }), { status: 200 })
        );

        await chat(requestWithOptions);

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude/sdk',
          expect.objectContaining({
            body: JSON.stringify({
              messages: testRequest.messages,
              sessionId: testRequest.sessionId,
              temperature: 0.8,
              maxTokens: 2000,
              tools: ['search', 'calculator'],
            }),
          })
        );
      });
    });
  });

  describe('Streaming Chat Functionality', () => {
    const testRequest: ChatRequest = {
      messages: [
        { role: 'user', content: 'Tell me a story' },
      ],
      sessionId: 'stream-session',
    };

    describe('streaming chat', () => {
      it('should stream chat responses', async () => {
        const mockStreamData = [
          'data: {"type":"text_chunk","content":"Once upon"}\n',
          'data: {"type":"text_chunk","content":" a time"}\n',
          'data: {"type":"done","session_id":"stream-session"}\n',
        ];

        const mockReadableStream = new ReadableStream({
          start(controller) {
            mockStreamData.forEach(chunk => {
              controller.enqueue(new TextEncoder().encode(chunk));
            });
            controller.close();
          },
        });

        fetchMock.mockResolvedValue(
          new Response(mockStreamData.join(''), {
            status: 200,
            body: mockReadableStream,
          })
        );

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat(testRequest)) {
          chunks.push(chunk);
        }

        expect(chunks).toEqual([
          { type: 'text_chunk', content: 'Once upon' },
          { type: 'text_chunk', content: ' a time' },
          { type: 'done', session_id: 'stream-session' },
        ]);
      });

      it('should handle streaming API errors', async () => {
        fetchMock.mockResolvedValue(
          new Response('Server Error', { status: 500 })
        );

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat(testRequest)) {
          chunks.push(chunk);
        }

        // Should get error chunks from fallback
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks.some(chunk => chunk.type === 'done')).toBe(true);
      });

      it('should fallback to claude-chat on streaming failure', async () => {
        setProvider('claude-sdk');
        
        fetchMock
          .mockResolvedValueOnce(new Response('Server Error', { status: 500 })) // claude-sdk fails
          .mockResolvedValueOnce(new Response(JSON.stringify({               // claude-chat fallback
            content: 'Fallback streaming response',
            sessionId: 'stream-session',
          }), { status: 200 }));

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat(testRequest)) {
          chunks.push(chunk);
        }

        expect(chunks).toContainEqual(
          expect.objectContaining({
            type: 'text_chunk',
            content: 'Fallback streaming response',
          })
        );
      });

      it('should handle malformed stream data gracefully', async () => {
        const malformedData = [
          'data: invalid json\n',
          'data: {"type":"text_chunk","content":"valid"}\n',
          'not a data line\n',
        ];

        const mockReadableStream = new ReadableStream({
          start(controller) {
            malformedData.forEach(chunk => {
              controller.enqueue(new TextEncoder().encode(chunk));
            });
            controller.close();
          },
        });

        fetchMock.mockResolvedValue(
          new Response(malformedData.join(''), {
            status: 200,
            body: mockReadableStream,
          })
        );

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat(testRequest)) {
          chunks.push(chunk);
        }

        // Should only get valid chunks
        expect(chunks).toContainEqual({
          type: 'text_chunk',
          content: 'valid',
        });
        expect(chunks).toContainEqual({
          type: 'done',
          session_id: 'stream-session',
        });
      });

      it('should yield final done chunk', async () => {
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({
            content: 'Simple response',
          }), { status: 200 })
        );

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat(testRequest)) {
          chunks.push(chunk);
        }

        expect(chunks[chunks.length - 1]).toMatchObject({
          type: 'done',
        });
      });
    });
  });

  describe('Provider Implementations', () => {
    describe('Claude SDK Provider', () => {
      beforeEach(() => {
        setProvider('claude-sdk');
      });

      it('should make requests to SDK endpoint', async () => {
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ content: 'SDK response' }), { status: 200 })
        );

        await chat({
          messages: [{ role: 'user', content: 'Test' }],
        });

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude/sdk',
          expect.any(Object)
        );
      });

      it('should check health endpoint', async () => {
        fetchMock.mockResolvedValue(
          new Response('OK', { status: 200 })
        );

        const providers = await getAvailableProviders();
        
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude/sdk/health',
          expect.objectContaining({
            method: 'GET',
          })
        );
      });

      it('should handle streaming requests', async () => {
        const streamData = 'data: {"type":"text_chunk","content":"Streamed"}\n';
        
        fetchMock.mockResolvedValue(
          new Response(streamData, {
            status: 200,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(streamData));
                controller.close();
              },
            }),
          })
        );

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat({
          messages: [{ role: 'user', content: 'Stream test' }],
        })) {
          chunks.push(chunk);
        }

        expect(chunks).toContainEqual({
          type: 'text_chunk',
          content: 'Streamed',
        });
      });
    });

    describe('Claude Chat Provider', () => {
      beforeEach(() => {
        setProvider('claude-chat');
      });

      it('should make requests to chat endpoint', async () => {
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ content: 'Chat response' }), { status: 200 })
        );

        await chat({
          messages: [{ role: 'user', content: 'Test' }],
        });

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude-chat',
          expect.any(Object)
        );
      });

      it('should always be available', async () => {
        const providers = await getAvailableProviders();
        expect(providers).toContain('claude-chat');
      });

      it('should provide simple streaming fallback', async () => {
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ content: 'Simple response' }), { status: 200 })
        );

        const chunks: StreamChunk[] = [];
        for await (const chunk of streamChat({
          messages: [{ role: 'user', content: 'Test' }],
        })) {
          chunks.push(chunk);
        }

        expect(chunks).toEqual([
          {
            type: 'text_chunk',
            content: 'Simple response',
            session_id: undefined,
          },
          {
            type: 'done',
            session_id: undefined,
          },
        ]);
      });
    });

    describe('Claude Main Provider', () => {
      beforeEach(() => {
        setProvider('claude-main');
      });

      it('should make requests to main endpoint with MCP', async () => {
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ content: 'Main response' }), { status: 200 })
        );

        await chat({
          messages: [{ role: 'user', content: 'Test' }],
          sessionId: 'main-session',
        });

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/claude-main',
          expect.objectContaining({
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'Test' }],
              sessionId: 'main-session',
              enableMCP: true,
            }),
          })
        );
      });

      it('should check MCP feature flag for availability', async () => {
        const { appConfig } = require('@/lib/config/app-config');
        appConfig.isFeatureEnabled.mockReturnValue(false);

        const providers = await getAvailableProviders();
        expect(providers).not.toContain('claude-main');

        appConfig.isFeatureEnabled.mockReturnValue(true);
        const providersEnabled = await getAvailableProviders();
        expect(providersEnabled).toContain('claude-main');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Should fallback to claude-chat
      const response = await chat({
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response).toBeDefined();
    });

    it('should handle JSON parse errors', async () => {
      fetchMock.mockResolvedValue(
        new Response('Invalid JSON', { status: 200 })
      );

      await expect(chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow();
    });

    it('should provide error chunks in streaming', async () => {
      setProvider('claude-sdk');
      fetchMock.mockRejectedValue(new Error('Streaming error'));

      const chunks: StreamChunk[] = [];
      for await (const chunk of streamChat({
        messages: [{ role: 'user', content: 'Test' }],
      })) {
        chunks.push(chunk);
      }

      // Should get fallback response
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].type).toBe('done');
    });

    it('should handle empty response bodies', async () => {
      fetchMock.mockResolvedValue(
        new Response('', { status: 200 })
      );

      await expect(chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow();
    });

    it('should handle missing response fields', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      const response = await chat({
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.content).toBe('');
    });
  });

  describe('Utility Functions', () => {
    it('should export utility functions that work with singleton', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ content: 'Utility test' }), { status: 200 })
      );

      // Test utility function
      const response = await chat({
        messages: [{ role: 'user', content: 'Test utility' }],
      });

      expect(response.content).toBe('Utility test');
    });

    it('should support provider switching via utility', () => {
      expect(() => setProvider('claude-chat')).not.toThrow();
      expect(() => setProvider('claude-main')).not.toThrow();
      expect(() => setProvider('claude-sdk')).not.toThrow();
    });

    it('should provide health check utility', async () => {
      fetchMock.mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      const health = await healthCheck();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('providers');
    });

    it('should provide available providers utility', async () => {
      fetchMock.mockResolvedValue(
        new Response('OK', { status: 200 })
      );

      const providers = await getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle provider failover gracefully', async () => {
      setProvider('claude-sdk');
      
      fetchMock
        .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 })) // SDK fails
        .mockResolvedValueOnce(new Response(JSON.stringify({                        // Chat succeeds
          content: 'Failover successful',
          sessionId: 'failover-session',
        }), { status: 200 }));

      const response = await chat({
        messages: [{ role: 'user', content: 'Test failover' }],
        sessionId: 'failover-session',
      });

      expect(response.content).toBe('Failover successful');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should maintain session context across providers', async () => {
      const sessionId = 'persistent-session-123';
      
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({
          content: 'Response',
          sessionId: sessionId,
        }), { status: 200 })
      );

      const response = await chat({
        messages: [{ role: 'user', content: 'Test' }],
        sessionId: sessionId,
      });

      expect(response.sessionId).toBe(sessionId);
    });

    it('should handle concurrent requests safely', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({
          content: `Response ${Math.random()}`,
        }), { status: 200 }))
      );

      const requests = Array.from({ length: 5 }, (_, i) =>
        chat({
          messages: [{ role: 'user', content: `Request ${i}` }],
          sessionId: `session-${i}`,
        })
      );

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.content).toMatch(/^Response /);
      });
    });

    it('should validate complex message chains', async () => {
      const complexMessages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi there! How can I help?' },
        { role: 'user', content: 'What is 2+2?' },
      ];

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ content: '2+2 equals 4.' }), { status: 200 })
      );

      const response = await chat({
        messages: complexMessages,
        options: {
          temperature: 0.1,
          maxTokens: 100,
        },
      });

      expect(response.content).toBe('2+2 equals 4.');
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/claude/sdk',
        expect.objectContaining({
          body: JSON.stringify({
            messages: complexMessages,
            temperature: 0.1,
            maxTokens: 100,
          }),
        })
      );
    });
  });

  describe('Performance', () => {
    it('should handle rapid successive requests', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({
          content: 'Fast response',
        }), { status: 200 }))
      );

      const start = Date.now();
      const requests = Array.from({ length: 20 }, () =>
        chat({
          messages: [{ role: 'user', content: 'Quick test' }],
        })
      );

      await Promise.all(requests);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    it('should handle large message payloads', async () => {
      const largeContent = 'x'.repeat(10000);
      
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ content: 'Processed large content' }), { status: 200 })
      );

      const response = await chat({
        messages: [{ role: 'user', content: largeContent }],
      });

      expect(response.content).toBe('Processed large content');
    });
  });

  describe('Type Safety', () => {
    it('should enforce Message type constraints', () => {
      const validMessage: Message = {
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      expect(validMessage.role).toBe('user');
      expect(typeof validMessage.content).toBe('string');
    });

    it('should enforce ChatRequest type constraints', () => {
      const validRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
        sessionId: 'session-123',
        provider: 'claude-sdk',
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          stream: false,
        },
      };

      expect(Array.isArray(validRequest.messages)).toBe(true);
      expect(typeof validRequest.sessionId).toBe('string');
    });

    it('should enforce StreamChunk type constraints', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ content: 'Test' }), { status: 200 })
      );

      for await (const chunk of streamChat({
        messages: [{ role: 'user', content: 'Test' }],
      })) {
        expect(['text_chunk', 'tool_use', 'error', 'done']).toContain(chunk.type);
        
        if (chunk.type === 'text_chunk') {
          expect(typeof chunk.content).toBe('string');
        }
      }
    });
  });
});