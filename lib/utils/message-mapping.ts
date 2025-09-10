import type { NewMessage, NewPart, MessageRecord, PartRecord } from '../db/schema';

export interface UITextPart {
  type: 'text';
  text: string;
}

export type UIMessage = {
  id?: number;
  role: 'user' | 'assistant';
  parts: UITextPart[];
  createdAt?: Date;
};

export function mapUIToDB(chatId: number, message: UIMessage): {
  message: Omit<NewMessage, 'id'>;
  parts: Array<Omit<NewPart, 'id' | 'messageId'>>;
} {
  return {
    message: {
      chatId,
      role: message.role,
      createdAt: message.createdAt ?? new Date(),
    },
    parts: message.parts.map((p, idx) => ({
      order: idx,
      text_content: p.text,
    })),
  };
}

export function mapDBToUI(
  message: MessageRecord,
  parts: PartRecord[],
): UIMessage {
  const sorted = [...parts].sort((a, b) => a.order - b.order);
  const text = sorted.map((p) => p.text_content ?? '').join('');
  return {
    id: message.id,
    role: message.role as 'user' | 'assistant',
    parts: [{ type: 'text', text }],
    createdAt: message.createdAt,
  };
}
