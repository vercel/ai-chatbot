import { generateUUID } from '@/lib/utils';

export const TEST_PROMPTS = {
  SKY: {
    MESSAGE: {
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      role: 'user',
      parts: [{ type: 'text', text: 'Why is the sky blue?' }],
    },
    OUTPUT_STREAM: [
      `data: {"type":"start","messageId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}`,
      `data: {"type":"start-step"}`,
      `data: {"type":"text","text":"It's "}`,
      `data: {"type":"text","text":"just "}`,
      `data: {"type":"text","text":"blue "}`,
      `data: {"type":"text","text":"duh! "}`,
      `data: {"type":"finish-step"}`,
      `data: {"type":"finish"}`,
    ],
  },
  GRASS: {
    MESSAGE: {
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      role: 'user',
      content: 'Why is grass green?',
      parts: [{ type: 'text', text: 'Why is grass green?' }],
    },

    OUTPUT_STREAM: [
      `data: {"type":"start"}`,
      `data: {"type":"start-step"}`,
      `data: {"type":"text","text":"It's "}`,
      `data: {"type":"text","text":"just "}`,
      `data: {"type":"text","text":"green "}`,
      `data: {"type":"text","text":"duh! "}`,
      `data: {"type":"finish-step"}`,
      `data: {"type":"finish"}`,
    ],
  },
};
