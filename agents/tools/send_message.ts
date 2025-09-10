export interface OutboundMessage {
  channel: string;
  text: string;
}

/**
 * Minimal send_message tool stub.
 * In real system this would publish to omni.outbox.
 */
export async function send_message(msg: OutboundMessage): Promise<OutboundMessage> {
  // Simulate async delivery
  return msg;
}
