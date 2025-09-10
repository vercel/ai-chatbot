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
