import { generateUUID } from '@/lib/utils';
import { expect, test } from '../fixtures';
import { TEST_PROMPTS } from '../prompts/routes';

const chatIdsCreatedByAda: Array<string> = [];

test.describe
  .serial('/api/chat', () => {
    test('Ada cannot invoke a chat generation with empty request body', async ({
      adaContext,
    }) => {
      const response = await adaContext.request.post('/api/chat', {
        data: JSON.stringify({}),
      });
      expect(response.status()).toBe(400);

      const text = await response.text();
      expect(text).toEqual('Invalid request body');
    });

    test('Ada can invoke chat generation', async ({ adaContext }) => {
      const chatId = generateUUID();

      const response = await adaContext.request.post('/api/chat', {
        data: {
          id: chatId,
          message: TEST_PROMPTS.SKY.MESSAGE,
          selectedChatModel: 'chat-model',
        },
      });
      expect(response.status()).toBe(200);

      const text = await response.text();
      const lines = text.split('\n');

      const [_, ...rest] = lines;
      expect(rest.filter(Boolean)).toEqual(TEST_PROMPTS.SKY.OUTPUT_STREAM);

      chatIdsCreatedByAda.push(chatId);
    });

    test("Babbage cannot append message to Ada's chat", async ({
      babbageContext,
    }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await babbageContext.request.post('/api/chat', {
        data: {
          id: chatId,
          message: TEST_PROMPTS.GRASS.MESSAGE,
          selectedChatModel: 'chat-model',
        },
      });
      expect(response.status()).toBe(403);

      const text = await response.text();
      expect(text).toEqual('Forbidden');
    });

    test("Babbage cannot delete Ada's chat", async ({ babbageContext }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await babbageContext.request.delete(
        `/api/chat?id=${chatId}`,
      );
      expect(response.status()).toBe(403);

      const text = await response.text();
      expect(text).toEqual('Forbidden');
    });

    test('Ada can delete her own chat', async ({ adaContext }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await adaContext.request.delete(
        `/api/chat?id=${chatId}`,
      );
      expect(response.status()).toBe(200);

      const deletedChat = await response.json();
      expect(deletedChat).toMatchObject({ id: chatId });
    });

    test('Ada cannot resume stream of chat that does not exist', async ({
      adaContext,
    }) => {
      const response = await adaContext.request.get(
        `/api/chat?chatId=${generateUUID()}`,
      );
      expect(response.status()).toBe(404);
    });

    test('Ada can resume chat generation', async ({ adaContext }) => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: 'Help me write an essay about Silcon Valley',
            parts: [
              {
                type: 'text',
                text: 'Help me write an essay about Silicon Valley',
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondRequest = adaContext.request.get(
        `/api/chat?chatId=${chatId}`,
      );

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

    test('Ada cannot resume chat generation that has ended', async ({
      adaContext,
    }) => {
      const chatId = generateUUID();

      const firstRequest = await adaContext.request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: 'Help me write an essay about Silcon Valley',
            parts: [
              {
                type: 'text',
                text: 'Help me write an essay about Silicon Valley',
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
        },
      });

      const secondRequest = adaContext.request.get(
        `/api/chat?chatId=${chatId}`,
      );

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

      const [, secondResponseContent] = await Promise.all([
        firstResponse.text(),
        secondResponse.text(),
      ]);

      expect(secondResponseContent).toEqual('');
    });

    test('Babbage cannot resume chat generation that belongs to Ada', async ({
      adaContext,
      babbageContext,
    }) => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post('/api/chat', {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: 'user',
            content: 'Help me write an essay about Silcon Valley',
            parts: [
              {
                type: 'text',
                text: 'Help me write an essay about Silicon Valley',
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: 'chat-model',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondRequest = babbageContext.request.get(
        `/api/chat?chatId=${chatId}`,
      );

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
