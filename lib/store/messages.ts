export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const PREFIX = 'responses:';
const cache = new Map<string, StoredMessage[]>();

function storageKey(threadId: string) {
  return `${PREFIX}${threadId}`;
}

export function getMessages(threadId: string): StoredMessage[] {
  if (cache.has(threadId)) return cache.get(threadId)!;
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(storageKey(threadId));
  const msgs: StoredMessage[] = raw ? JSON.parse(raw) : [];
  cache.set(threadId, msgs);
  return msgs;
}

export function setMessages(threadId: string, messages: StoredMessage[]) {
  cache.set(threadId, messages);
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(threadId), JSON.stringify(messages));
}

export function addMessage(threadId: string, message: StoredMessage) {
  const messages = getMessages(threadId);
  messages.push(message);
  setMessages(threadId, messages);
}

export function clearCache() {
  cache.clear();
}
