export interface InboxMessage {
  threadId: string;
  content: string;
}

export interface OutboxMessage {
  id: string;
  threadId: string;
  content: string;
}

/**
 * Post a message to the omni inbox.
 */
export async function postInbox(message: InboxMessage): Promise<void> {
  const res = await fetch('/api/omni/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    throw new Error('Failed to send message');
  }
}

/**
 * Retrieve messages from the omni outbox for a given thread.
 */
export async function fetchOutbox(threadId: string): Promise<OutboxMessage[]> {
  const res = await fetch(`/api/omni/outbox?threadId=${encodeURIComponent(threadId)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch outbox');
  }
  return res.json();
}
