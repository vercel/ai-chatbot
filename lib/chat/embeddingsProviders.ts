import { Pinecone } from "@pinecone-database/pinecone"
import { DocumentoSTJ } from "../types";
import { encoding_for_model, TiktokenModel } from 'tiktoken';

async function splitTextIntoChunks(text: string, model: TiktokenModel, maxTokens: number): Promise<string[]> {
  const encoder = encoding_for_model(model); // Inicializa o codificador
  const tokens = encoder.encode(text); // Codifica o texto
  const chunks: string[] = [];

  for (let i = 0; i < tokens.length; i += maxTokens) {
    const chunk = tokens.slice(i, i + maxTokens); // Divide o texto em chunks
    const decodedChunk = new TextDecoder().decode(encoder.decode(chunk)); // Decodifica o chunk para texto
    chunks.push(decodedChunk);
  }

  console.log(chunks.length, "chunks created.");

  encoder.free();
  return chunks;
}

export const createEmbeddings = async (text: string, provider: string) => {
  console.log("Creating embeddings for: ", text.slice(0, 13));
  console.log("Provider: ", provider);

  try {
    const model = provider === "weviate" ? 'text-embedding-3-large' as TiktokenModel : 'text-embedding-ada-002' as TiktokenModel;
    const maxTokens = 8191;
    const chunks = await splitTextIntoChunks(text, model, maxTokens);

    const embeddings = await Promise.all(chunks.map(async (chunk) => {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          input: chunk,
        }),
      });

      const result = await response.json();
      if (!result.data) {
        console.error('Error creating embedding for chunk:', chunk);
        throw new Error('Failed to create embedding.');
      }

      return result.data[0].embedding as number[];
    }));

    const combinedEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, embedding) => sum + embedding[i], 0) / embeddings.length
    );

    return combinedEmbedding;

  } catch (error) {
    console.error("Error creating embedding: ", error);
    throw error;
  }
};

function getMetadataSize(metadata: any) {;
  return new TextEncoder().encode(JSON.stringify(metadata)).length;
}

export async function storeDocumentsInPinecone(documents: DocumentoSTJ[], namespaceId: string) {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });

    const index = await pinecone.index('lexgpt');
    const namespace = index.namespace(namespaceId);

    for (const doc of documents) {
      const documentId = doc.process.trim(); // Unique ID for the document

      // Combine fields into a single searchable content
      let content = `${doc.process} ${doc.relator} ${doc.classe} ${doc.ementa} ${doc.acordao}`.trim();

      // Create embedding for the document
      const embedding = await createEmbeddings(content, 'pinecone') as number[];

      let metadata = {
        process: doc.process,
        relator: doc.relator,
        classe: doc.classe,
        ementa: doc.ementa,
        acordao: doc.acordao,
        link: doc.link,
        document: content, // Full content for context
      };

      // Check and reduce metadata size dynamically

      // TODO marcos - paginação conteudo
      const maxSize = 40960; // 40 KB limit
      while (getMetadataSize(metadata) > maxSize) {
        console.log(`Metadata size (${getMetadataSize(metadata)} bytes) exceeds the limit. Reducing size...`);

        // Dynamically truncate the document field to reduce metadata size
        if (metadata.document) {
          metadata.document = metadata.document.slice(0, metadata.document.length - 1000);
        }
      }

      console.log(`Final metadata size: ${getMetadataSize(metadata)} bytes`);

      // Upsert the document into Pinecone
      await namespace.upsert([
        {
          id: documentId,
          values: embedding,
          metadata,
        },
      ]);

      console.log(`Document with ID ${documentId} stored successfully in Pinecone namespace ${namespaceId}.`);
    }

    console.log('All documents processed successfully.');
  } catch (error) {
    console.error('Error storing documents in Pinecone:', error);
    throw error;
  }
}

// Namespace dinamico
export const getEmbeddingsFromPinecone = async (vectors: number[], namespaceId: string) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    })

    const index = await pinecone.index('lexgpt')
    const namespace = index.namespace(namespaceId)
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
  