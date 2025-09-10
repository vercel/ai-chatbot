import { detect_intent, type Intent } from './policies';
import { handleSales } from './handlers/sales';
import { kb_search } from '../kb/kb_search';
import { send_message } from '../tools/send_message';

export interface MessageCanonical {
  text: string;
  channel: string;
}

export interface TriageResult {
  intent: Intent;
  reply: string;
}

/**
 * Minimal triage router. Detects intent, uses handlers and tools.
 */
export async function triage(msg: MessageCanonical): Promise<TriageResult> {
  const intent = detect_intent(msg.text);
  let reply: string;

  switch (intent) {
    case 'greeting':
      reply = 'Olá! Como posso ajudar?';
      break;
    case 'budget':
      reply = handleSales();
      break;
    default:
      const snippets = await kb_search(msg.text);
      reply = snippets[0]?.snippet ?? 'Não encontrei informação relevante.';
  }

  await send_message({ channel: msg.channel, text: reply });
  return { intent, reply };
}
