import { compose } from "@/lib/services/template-composer"
import { emitComplianceFailed } from "@/lib/analytics/events"
import type { ComposeRequest } from "@/lib/types/messaging"
import { type MessageCanonical } from "@/lib/omni/schema";
import pino from "pino";

export interface WhatsAppMessage {
  to: { contact: string };
  text: string;
  media?: string;
  templateId?: string;
}

const log = pino({ name: "whatsapp-adapter", level: process.env.LOG_LEVEL || "info" });

export interface DeliveryResult { status: "sent"|"queued"|"failed"; id?: string; attempts: number; error?: string }

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

/**
 * sendWhatsApp — envia mensagem canônica via MCP (HTTP) com backoff e idempotência.
 * Requer MCP_WHATSAPP_URL e MCP_TOKEN.
 */
export async function sendWhatsApp(message: MessageCanonical): Promise<DeliveryResult> {
  const url = process.env.MCP_WHATSAPP_URL || "http://localhost:4000";
  const token = process.env.MCP_TOKEN || "dev-token";
  const idempotencyKey = message.id;

  const body = {
    id: message.id,
    to: message.to.phone || message.to.id,
    text: message.text,
    media: message.media?.url,
    meta: { conversationId: message.conversationId },
  };

  let attempt = 0;
  const maxAttempts = 4;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/send`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({} as any));
        log.info({ id: json?.id || message.id }, "wa_sent");
        return { status: (json?.status as any) || "sent", id: json?.id || message.id, attempts: attempt };
      }
      if (res.status >= 400 && res.status < 500) {
        const txt = await res.text();
        log.warn({ status: res.status, txt }, "wa_client_error");
        return { status: "failed", attempts: attempt, error: `HTTP ${res.status}` };
      }
      // 5xx → backoff
      const back = Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.floor(Math.random() * 200);
      await sleep(back);
    } catch (err) {
      const back = Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.floor(Math.random() * 200);
      log.error({ err, attempt }, "wa_send_error");
      await sleep(back);
    }
  }
  return { status: "failed", attempts: maxAttempts, error: "max_retries" };
}

/** Compat layer: mantém API anterior usada em testes do dispatcher */
export async function sendWhatsappMCP(msg: WhatsAppMessage): Promise<{ status: string }>{
  const canonical: MessageCanonical = {
    id: `out-${Date.now()}`,
    channel: "whatsapp",
    direction: "out",
    conversationId: "conv-dispatch",
    from: { id: "agent:bot" },
    to: { id: `wa:${msg.to.contact}`, phone: msg.to.contact },
    timestamp: Date.now(),
    text: msg.text,
    media: msg.media ? { url: msg.media, mime: "application/octet-stream" } : undefined,
  };
  const res = await sendWhatsApp(canonical);
  if (res.status === "failed") throw new Error(res.error || "send failed");
  return { status: res.status };
}

export async function sendWhatsappTemplate(req: ComposeRequest & { to: { contact: string } }) {
  const res = compose(req)
  if (res.compliance.status === "fail") {
    emitComplianceFailed(res.compliance)
    return { status: "blocked", errors: res.compliance.errors }
  }
  const textParts = [res.rendered.header, res.rendered.body, res.rendered.footer].filter(Boolean)
  const msg: WhatsAppMessage = { to: req.to, text: textParts.join("\n") }
  if (res.raw.cta?.url_template) msg.templateId = res.raw.cta.url_template
  return sendWhatsappMCP(msg)
}
