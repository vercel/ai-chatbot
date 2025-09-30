import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

export interface MessageCanonical {
  id: string;
  direction: 'in' | 'out';
  channel: string;
  type: string;
  text?: string;
  mediaUrl?: string;
}

export interface WhatsAppEvent {
  id?: string;
  type: string;
  text?: string;
  mediaUrl?: string;
}

/**
 * Minimal WhatsApp MCP client.
 *
 * In a real environment this connects to the MCP server via WebSocket and
 * emits canonical messages. For local development or tests the `simulate`
 * method can be used to feed synthetic events.
 */
export class WhatsAppMCPClient extends EventEmitter {
  // biome-ignore lint/suspicious/noExplicitAny: WebSocket instance is provided by the runtime
  private ws?: any;

  constructor(private url: string, private token: string) {
    super();
  }

  /**
   * Connects to the MCP server using the global WebSocket implementation when
   * available. This is a best-effort implementation so the code remains runnable
   * without additional dependencies during tests.
   */
  async connect(): Promise<void> {
    // biome-ignore lint/suspicious/noExplicitAny: accessing global WebSocket
    const WebSocketImpl: any = (globalThis as any).WebSocket;
    if (!WebSocketImpl) {
      throw new Error('WebSocket implementation not found');
    }
    this.ws = new WebSocketImpl(this.url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload: WhatsAppEvent = JSON.parse(String(event.data));
        this.emit('message', this.normalize(payload));
      } catch (err) {
        this.emit('error', err);
      }
    };
  }

  /** Normalizes a raw WhatsApp event into the canonical format. */
  private normalize(event: WhatsAppEvent): MessageCanonical {
    return {
      id: event.id ?? randomUUID(),
      direction: 'in',
      channel: 'whatsapp',
      type: event.type,
      text: event.text,
      mediaUrl: event.mediaUrl,
    };
  }

  /** Utility used in tests to emit synthetic events. */
  simulate(event: WhatsAppEvent): void {
    this.emit('message', this.normalize(event));
  }
}
