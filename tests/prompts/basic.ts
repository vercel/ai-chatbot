import { CoreMessage } from 'ai';

export const TEST_PROMPTS: Record<string, CoreMessage[]> = {
  PROMPT_1: [
    {
      role: 'user',
      content: [{ type: 'text', text: 'why is grass green?' }],
    },
  ],
  PROMPT_2: [
    {
      role: 'user',
      content: [{ type: 'text', text: 'why is the sky blue?' }],
    },
  ],
};
