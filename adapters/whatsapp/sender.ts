import { compose } from "@/lib/services/template-composer"
import { emitComplianceFailed } from "@/lib/analytics/events"
import type { ComposeRequest } from "@/lib/types/messaging"

export interface WhatsAppMessage {
  to: { contact: string };
  text: string;
  media?: string;
  templateId?: string;
}

/**
 * sendWhatsappMCP simulates sending a WhatsApp message through MCP.
 * In production this should call the actual MCP bridge.
 */
export async function sendWhatsappMCP(msg: WhatsAppMessage): Promise<{ status: string }>{
  console.log("send_whatsapp_mcp", msg);
  // Placeholder for MCP integration
  return { status: "sent" };
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
