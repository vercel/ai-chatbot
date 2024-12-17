import { Pinecone } from "@pinecone-database/pinecone"
import { DocumentoSTJ } from "../types";
import { kv } from '@vercel/kv';

export const createEmbeddings = async (text: string, provider: string) => {    
  console.log("Creating embeddings for: ", text)
  console.log("Provider: ", provider)
  try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: provider == "weviate" ? 'text-embedding-3-large' : 'text-embedding-ada-002',
          input: text.replace(/\n/g, ' ')
        })
      });
    
      const result = await response.json();
      if (!result.data) {
        console.error('Error creating embedding:', text);
        console.error("Error creating embedding: ", result)
        return
      }
      console.log("Embedding created: ", result.data[0].embedding)
      return result.data[0].embedding as number[]
  } catch (error) {
      console.log("Error getting embedding ",error)
      throw error
  }
}

export async function storeDocumentsInPinecone(documents: DocumentoSTJ[]) {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });

    const index = await pinecone.index('lexgpt');
    const namespace = index.namespace('stj');

    console.log(`Fetching existing document IDs`);

    let cachedIds = await kv.get<string[]>('pinecone_existing_ids');

    if (!cachedIds) {
      console.log(`No cached IDs found, fetching from Pinecone.`);

      // Fetch all IDs from Pinecone with pagination
      let fetchedIds: string[] = [];
      let paginationToken: string | undefined = undefined;

      do {
        console.log(`Fetching IDs with pagination token: ${paginationToken}`);
        const response = await index.listPaginated({ paginationToken });
        fetchedIds.push(...response.vectors.map((vector) => vector.id));
        paginationToken = response.pagination?.next;
      } while (paginationToken);

      // Cache fetched IDs in KV
      console.log(`Fetched ${fetchedIds.length} IDs from Pinecone.`);
      await kv.set('pinecone_existing_ids', fetchedIds);
      cachedIds = fetchedIds;
    }

    const cachedIdSet = new Set(cachedIds);

    for (const doc of documents) {
      const documentId = doc.process.trim(); // Unique ID for the document

      if (cachedIdSet.has(documentId)) {
        console.log(`Document with ID ${documentId} already exists in cache. Skipping.`);
        continue;
      }

      // Combine fields into a single searchable content
      const content = `${doc.process} ${doc.relator} ${doc.classe} ${doc.ementa} ${doc.acordao}`.trim();

      // Create embedding for the document
      const embedding = await createEmbeddings(content, 'pinecone') as number[];

      // Upsert the document into Pinecone
      await namespace.upsert([
        {
          id: documentId,
          values: embedding,
          metadata: {
            process: doc.process,
            relator: doc.relator,
            classe: doc.classe,
            ementa: doc.ementa,
            acordao: doc.acordao,
            link: doc.link,
            document: content, // Store full content for context
          },
        },
      ]); console.log(`Document with ID ${documentId} stored successfully in Pinecone.`);

      // Update the cache with the new ID
      cachedIdSet.add(documentId);
      await kv.set('pinecone_existing_ids', Array.from(cachedIdSet)); // Persist the updated cache
    }

    console.log('All documents processed successfully.');
  } catch (error) {
    console.error('Error storing documents in Pinecone:', error);
    throw error;
  }
}


export const getEmbeddingsFromPinecone = async (vectors: number[]) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    })

    const index = await pinecone.index('lexgpt')
    const namespace = index.namespace('stj')
    const response = await namespace.query({
      vector: vectors,
      topK: 4,
      includeMetadata: true
    })
    return response.matches.map((match: any) => match.metadata.document).join()
  } catch (error) {
    console.log("Error getting embeddings from Pinecone ",error)
    throw error
  }
}
  
export const getEmbeddingsFromQdrant = async (vectors: number[], collection_name: string) => {
  try {
    const response = await fetch(`${process.env.QDRANT_URL}/collections/${collection_name}/points/search` || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': `${process.env.QDRANT_API_KEY}`
      },
      body: JSON.stringify({
        vector: vectors,
        limit: 4,
        with_payload: true
      })
    });
    const result = await response.json();
    console.log("Qdrant result: ", result)
    return result.result.reduce((acc: any, cur: any) => `${acc} ${cur.payload.content}`, '')
  } catch (error) {
    console.log("Error getting embeddings from Qdrant ",error)
    throw error
  }
}

export const getEmbeddingsFromWeviate = async (vectors: number[]) => {
  try {
    const query = JSON.stringify({
      query: `{
        Get {
          Legis_13105(
            nearVector: {
              vector: ${JSON.stringify(vectors)}
            }
            limit: 3
          ) {
            text
            source
            _additional {
              certainty
              distance
            }
          }
        }
      }`
    });

    const response = await fetch(`${process.env.WEVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEVIATE_API_KEY}`,
      },
      body: query,
    });

    const result = await response.json();
  //   console.log("Weviate result: ", result);

    // Adjust the result processing as needed based on the actual response structure
    return result.data.Get.Legis_13105.map((item: any) => JSON.stringify(item)).join()

  } catch (error) {
    console.log("Error getting embeddings from Weviate ", error);
    throw error;
  }
}
  