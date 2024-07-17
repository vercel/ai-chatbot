import { Pinecone } from "@pinecone-database/pinecone"

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
  