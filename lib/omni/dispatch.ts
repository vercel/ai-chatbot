import { sendWhatsApp, sendWhatsappMCP, type WhatsAppMessage } from "../../adapters/whatsapp/sender";
import type { MessageCanonical } from "@/lib/omni/schema";

export interface OutboxMessage {
  to: { kind: string; contact: string; route?: { adapter?: string } };
  text: string;
  media?: string;
  templateId?: string;
}

function isCanonical(m: unknown): m is MessageCanonical {
  // minimal detection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const x = m as any;
  return x && typeof x === 'object' && x.channel && x.direction && x.from && x.to;
}

/** Route outgoing messages to the proper adapter; accepts canonical or legacy */
export async function dispatch(msg: OutboxMessage | MessageCanonical) {
  // Canonical path
  if (isCanonical(msg)) {
    if (msg.channel === 'whatsapp') {
      await sendWhatsApp(msg);
      return;
    }
    throw new Error(`no adapter for channel ${msg.channel}`);
  }

  // Legacy path
  if (msg.to.kind === "whatsapp") {
    const wa: WhatsAppMessage = {
      to: { contact: msg.to.contact },
      text: msg.text,
      media: msg.media,
      templateId: msg.templateId,
    };
    await sendWhatsappMCP(wa);
  } else {
    throw new Error(`no adapter for kind ${msg.to.kind}`);
  }
}
