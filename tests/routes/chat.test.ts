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
        data: {},
      });
      expect(response.status()).toBe(500);

      const text = await response.text();
      expect(text).toEqual('An error occurred while processing your request!');
    });

    test('Ada can invoke chat generation', async ({ adaContext }) => {
      const chatId = generateUUID();

      const response = await adaContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: TEST_PROMPTS.SKY.MESSAGES,
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

      const response = await babbageContext.request.post('api/chat', {
        data: {
          id: chatId,
          messages: TEST_PROMPTS.GRASS.MESSAGES,
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
        `api/chat?id=${chatId}`,
      );
      expect(response.status()).toBe(403);

      const text = await response.text();
      expect(text).toEqual('Forbidden');
    });

    test('Ada can delete her own chat', async ({ adaContext }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await adaContext.request.delete(`api/chat?id=${chatId}`);
      expect(response.status()).toBe(200);

      const deletedChat = await response.json();
      expect(deletedChat).toMatchObject({ id: chatId });
    });
  });
