import { useCallback, useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

import { addMessage, getMessages, setMessages, type StoredMessage } from '../../../../lib/store/messages';
import { fetchOutbox, postInbox } from '../../../../lib/omni/client';

export interface UseChatOptions {
  threadId: string;
  pollInterval?: number;
}

export function useChat({ threadId, pollInterval = 1000 }: UseChatOptions) {
  const [messages, setLocal] = useState<StoredMessage[]>(() => getMessages(threadId));
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const message: StoredMessage = { id: nanoid(), role: 'user', content };
    addMessage(threadId, message);
    setLocal([...messages, message]);
    try {
      await postInbox({ threadId, content });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [messages, threadId]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const out = await fetchOutbox(threadId);
        if (out.length) {
          const current = getMessages(threadId);
          const newMsgs = out.map(m => ({ id: m.id, role: 'assistant', content: m.content }));
          const all = [...current, ...newMsgs];
          setMessages(threadId, all);
          setLocal(all);
        }
      } catch (err) {
        // ignore polling errors
      }
    }, pollInterval);
    return () => clearInterval(id);
  }, [threadId, pollInterval]);

  return { messages, sendMessage, error };
}
