import type { MessageCanonical } from '../whatsapp/mcp-client';

/**
 * Creates a web outbound message that echoes the WhatsApp inbound content.
 */
export function echoWeb(message: MessageCanonical): MessageCanonical {
  return {
    ...message,
    id: `${message.id}-web`,
    direction: 'out',
    channel: 'web',
  };
}
