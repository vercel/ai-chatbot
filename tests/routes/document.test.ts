import type { Document } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import { expect, test } from '../fixtures';
import { getMessageByErrorCode } from '@/lib/errors';

const documentsCreatedByAda: Array<Document> = [];

test.describe
  .serial('/api/document', () => {
    test('Ada cannot retrieve a document without specifying an id', async ({
      adaContext,
    }) => {
      const response = await adaContext.request.get('/api/document');
      expect(response.status()).toBe(400);

      const { code, message } = await response.json();
      expect(code).toEqual('bad_request:api');
      expect(message).toEqual(getMessageByErrorCode(code));
    });

    test('Ada cannot retrieve a document that does not exist', async ({
      adaContext,
    }) => {
      const documentId = generateUUID();

      const response = await adaContext.request.get(
        `/api/document?id=${documentId}`,
      );
      expect(response.status()).toBe(404);

      const { code, message } = await response.json();
      expect(code).toEqual('not_found:document');
      expect(message).toEqual(getMessageByErrorCode(code));
    });

    test('Ada can create a document', async ({ adaContext }) => {
      const documentId = generateUUID();

      const draftDocument = {
        title: "Ada's Document",
        kind: 'text',
        content: 'Created by Ada',
      };

      const response = await adaContext.request.post(
        `/api/document?id=${documentId}`,
        {
          data: draftDocument,
        },
      );
      expect(response.status()).toBe(200);

      const [createdDocument] = await response.json();
      expect(createdDocument).toMatchObject(draftDocument);

      documentsCreatedByAda.push(createdDocument);
    });

    test('Ada can retrieve a created document', async ({ adaContext }) => {
      const [document] = documentsCreatedByAda;

      const response = await adaContext.request.get(
        `/api/document?id=${document.id}`,
      );
      expect(response.status()).toBe(200);

      const retrievedDocuments = await response.json();
      expect(retrievedDocuments).toHaveLength(1);

      const [retrievedDocument] = retrievedDocuments;
      expect(retrievedDocument).toMatchObject(document);
    });

    test('Ada can save a new version of the document', async ({
      adaContext,
    }) => {
      const [firstDocument] = documentsCreatedByAda;

      const draftDocument = {
        title: "Ada's Document",
        kind: 'text',
        content: 'Updated by Ada',
      };

      const response = await adaContext.request.post(
        `/api/document?id=${firstDocument.id}`,
        {
          data: draftDocument,
        },
      );
      expect(response.status()).toBe(200);

      const [createdDocument] = await response.json();
      expect(createdDocument).toMatchObject(draftDocument);

      documentsCreatedByAda.push(createdDocument);
    });

    test('Ada can retrieve all versions of her documents', async ({
      adaContext,
    }) => {
      const [firstDocument, secondDocument] = documentsCreatedByAda;

      const response = await adaContext.request.get(
        `/api/document?id=${firstDocument.id}`,
      );
      expect(response.status()).toBe(200);

      const retrievedDocuments = await response.json();
      expect(retrievedDocuments).toHaveLength(2);

      const [firstRetrievedDocument, secondRetrievedDocument] =
        retrievedDocuments;
      expect(firstRetrievedDocument).toMatchObject(firstDocument);
      expect(secondRetrievedDocument).toMatchObject(secondDocument);
    });

    test('Ada cannot delete a document without specifying an id', async ({
      adaContext,
    }) => {
      const response = await adaContext.request.delete(`/api/document`);
      expect(response.status()).toBe(400);

      const { code, message } = await response.json();
      expect(code).toEqual('bad_request:api');
      expect(message).toEqual(getMessageByErrorCode(code));
    });

    test('Ada cannot delete a document without specifying a timestamp', async ({
      adaContext,
    }) => {
      const [firstDocument] = documentsCreatedByAda;

      const response = await adaContext.request.delete(
        `/api/document?id=${firstDocument.id}`,
      );
      expect(response.status()).toBe(400);

      const { code, message } = await response.json();
      expect(code).toEqual('bad_request:api');
      expect(message).toEqual(getMessageByErrorCode(code));
    });

    test('Ada can delete a document by specifying id and timestamp', async ({
      adaContext,
    }) => {
      const [firstDocument, secondDocument] = documentsCreatedByAda;

      const response = await adaContext.request.delete(
        `/api/document?id=${firstDocument.id}&timestamp=${firstDocument.createdAt}`,
      );
      expect(response.status()).toBe(200);

      const deletedDocuments = await response.json();
      expect(deletedDocuments).toHaveLength(1);

      const [deletedDocument] = deletedDocuments;
      expect(deletedDocument).toMatchObject(secondDocument);
    });

    test('Ada can retrieve documents without deleted versions', async ({
      adaContext,
    }) => {
      const [firstDocument] = documentsCreatedByAda;

      const response = await adaContext.request.get(
        `/api/document?id=${firstDocument.id}`,
      );
      expect(response.status()).toBe(200);

      const retrievedDocuments = await response.json();
      expect(retrievedDocuments).toHaveLength(1);

      const [firstRetrievedDocument] = retrievedDocuments;
      expect(firstRetrievedDocument).toMatchObject(firstDocument);
    });

    test("Babbage cannot update Ada's document", async ({ babbageContext }) => {
      const [firstDocument] = documentsCreatedByAda;

      const draftDocument = {
        title: "Babbage's Document",
        kind: 'text',
        content: 'Created by Babbage',
      };

      const response = await babbageContext.request.post(
        `/api/document?id=${firstDocument.id}`,
        {
          data: draftDocument,
        },
      );
      expect(response.status()).toBe(403);

      const { code, message } = await response.json();
      expect(code).toEqual('forbidden:document');
      expect(message).toEqual(getMessageByErrorCode(code));
    });

    test("Ada's documents did not get updated", async ({ adaContext }) => {
      const [firstDocument] = documentsCreatedByAda;

      const response = await adaContext.request.get(
        `/api/document?id=${firstDocument.id}`,
      );
      expect(response.status()).toBe(200);

      const documentsRetrieved = await response.json();
      expect(documentsRetrieved).toHaveLength(1);
    });
  });
