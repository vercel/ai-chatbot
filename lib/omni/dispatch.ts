import { sendWhatsappMCP, type WhatsAppMessage } from "../../adapters/whatsapp/sender";

export interface OutboxMessage {
  to: { kind: string; contact: string; route?: { adapter?: string } };
  text: string;
  media?: string;
  templateId?: string;
}

/** Route outgoing messages to the proper adapter */
export async function dispatch(msg: OutboxMessage) {
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
