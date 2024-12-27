import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class LangChainService {
  private pineconeClient: Pinecone;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-large",
      dimensions: 3072,
    });
  }

  async initialize() {
    // No need for init anymore as it's done in constructor
  }

  async ingestDocument(text: string, metadata: Record<string, any> = {}) {
    console.log('📥 Starting document ingestion');
    try {
      // Generate embedding directly
      const embedding = await this.embeddings.embedQuery(text);
      console.log('🔤 Generated embedding for document');

      const index = this.pineconeClient.Index(process.env.PINECONE_INDEX_NAME!);
      
      // Insert directly into Pinecone
      await index.upsert([{
        id: Date.now().toString(),
        values: embedding,
        metadata: {
          ...metadata,
          text: text, // Store the text in metadata
        },
      }]);

      console.log('✅ Document successfully ingested');
      return 1;
    } catch (error) {
      console.error('❌ Error in document ingestion:', error);
      throw error;
    }
  }

  async similaritySearch(query: string, k: number = 4) {
    console.log('📝 Starting similarity search for:', query);
    try {
      const index = this.pineconeClient.Index(process.env.PINECONE_INDEX_NAME!);
      console.log('📊 Connected to Pinecone index:', process.env.PINECONE_INDEX_NAME);

      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);
      console.log('🔤 Generated query embedding');

      // Direct Pinecone query for more control
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: k,
        includeMetadata: true,
        includeValues: true,
      });
      
      console.log('🔍 Raw Pinecone results:', JSON.stringify(queryResponse, null, 2));

      // Transform results into expected format
      const results = queryResponse.matches.map(match => ({
        pageContent: match.metadata?.text || '',
        metadata: match.metadata || {},
        score: match.score,
      }));

      console.log('✨ Processed search results:', JSON.stringify(results, null, 2));
      return results;
    } catch (error) {
      console.error('❌ Error in similarity search:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const langchainService = new LangChainService();
