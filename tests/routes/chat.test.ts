import { generateUUID } from '@/lib/utils';
import {
  createAuthenticatedContext,
  type UserContext,
} from '@/tests/auth-helper';
import { expect, test } from '@playwright/test';

let adaContext: UserContext;
let babbageContext: UserContext;

test.beforeAll(async ({ browser }) => {
  adaContext = await createAuthenticatedContext({
    browser,
    name: 'ada',
  });

  babbageContext = await createAuthenticatedContext({
    browser,
    name: 'babbage',
  });
});

test.afterAll(async () => {
  await adaContext.context.close();
});

const streamOutput = [
  '0:"It\'s "',
  '0:"just "',
  '0:"blue "',
  '0:"duh! "',
  'e:{"finishReason":"stop","usage":{"promptTokens":3,"completionTokens":10},"isContinued":false}',
  'd:{"finishReason":"stop","usage":{"promptTokens":3,"completionTokens":10}}',
];

const chatIdsCreatedByAda: Array<string> = [];

test.describe
  .serial('/api/chat', () => {
    test('Ada cannot invoke a chat generation with empty request body', async () => {
      const response = await adaContext.request.post('/api/chat', {
        data: {},
      });
      expect(response.status()).toBe(500);

      const text = await response.text();
      expect(text).toEqual('An error occurred while processing your request!');
    });

    test('Ada can invoke chat generation', async () => {
      const chatId = generateUUID();

      const response = await adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'Why is the sky blue?',
              parts: [{ type: 'text', text: 'Why is the sky blue?' }],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });
      expect(response.status()).toBe(200);

      const text = await response.text();
      const lines = text.split('\n');

      const [_, ...rest] = lines;
      expect(rest.filter(Boolean)).toEqual(streamOutput);

      chatIdsCreatedByAda.push(chatId);
    });

    test("Babbage cannot append message to Ada's chat", async () => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await babbageContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'Why is grass green?',
              parts: [{ type: 'text', text: 'Why is grass green?' }],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });
      expect(response.status()).toBe(403);

      const text = await response.text();
      expect(text).toEqual('Forbidden');
    });

    test('Ada cannot resume stream of chat that does not exist', async () => {
      const response = await adaContext.request.post('api/chat', {
        data: {
          id: generateUUID(),
          messages: [
            {
              role: 'user',
              content: 'ping',
              parts: [{ type: 'text', text: 'ping' }],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });
      expect(response.status()).toBe(204);
    });

    test('Ada can resume chat generation', async () => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'Help me write an essay about Silcon Valley',
              parts: [
                {
                  type: 'text',
                  text: 'Help me write an essay about Silicon Valley',
                },
              ],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondRequest = adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'ping',
              parts: [
                {
                  type: 'text',
                  text: 'ping',
                },
              ],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(200);

      const [firstResponseBody, secondResponseBody] = await Promise.all([
        await firstResponse.body(),
        await secondResponse.body(),
      ]);

      expect(firstResponseBody.toString()).toEqual(
        secondResponseBody.toString(),
      );
    });

    test('Ada cannot resume chat generation that has ended', async () => {
      const chatId = generateUUID();

      const firstRequest = await adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'Help me write an essay about Silcon Valley',
              parts: [
                {
                  type: 'text',
                  text: 'Help me write an essay about Silicon Valley',
                },
              ],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });

      const secondRequest = adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'ping',
              parts: [
                {
                  type: 'text',
                  text: 'ping',
                },
              ],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(204);
    });

    test('Babbage cannot resume chat generation that belongs to Ada', async () => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'Help me write an essay about Silcon Valley',
              parts: [
                {
                  type: 'text',
                  text: 'Help me write an essay about Silicon Valley',
                },
              ],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondRequest = babbageContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: [
            {
              role: 'user',
              content: 'ping',
              parts: [
                {
                  type: 'text',
                  text: 'ping',
                },
              ],
            },
          ],
          selectedChatModel: 'chat-model',
        },
      });

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(403);
    });
  });
