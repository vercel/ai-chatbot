export const TEST_PROMPTS = {
  SKY: {
    MESSAGES: [
      {
        role: 'user',
        content: 'Why is the sky blue?',
        parts: [{ type: 'text', text: 'Why is the sky blue?' }],
      },
    ],
    OUTPUT_STREAM: [
      '0:"It\'s "',
      '0:"just "',
      '0:"blue "',
      '0:"duh! "',
      'e:{"finishReason":"stop","usage":{"promptTokens":3,"completionTokens":10},"isContinued":false}',
      'd:{"finishReason":"stop","usage":{"promptTokens":3,"completionTokens":10}}',
    ],
  },
  GRASS: {
    MESSAGES: [
      {
        role: 'user',
        content: 'Why is grass green?',
        parts: [{ type: 'text', text: 'Why is grass green?' }],
      },
    ],
    OUTPUT_STREAM: [
      '0:"It\'s "',
      '0:"just "',
      '0:"green "',
      '0:"duh! "',
      'e:{"finishReason":"stop","usage":{"promptTokens":3,"completionTokens":10},"isContinued":false}',
      'd:{"finishReason":"stop","usage":{"promptTokens":3,"completionTokens":10}}',
    ],
  },
};
