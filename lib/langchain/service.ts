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
    console.log("📥 Starting document ingestion");
    try {
      const embedding = await this.embeddings.embedQuery(text);
      console.log("🔤 Generated embedding for document");

      const index = this.pineconeClient.Index(process.env.PINECONE_INDEX_NAME!);
      const timestamp = Date.now();

      await index.upsert([
        {
          id: timestamp.toString(),
          values: embedding,
          metadata: {
            text: text,
            userId: metadata.userId,
            timestamp: timestamp,
          },
        },
      ]);

      console.log("✅ Document successfully ingested");
      return 1;
    } catch (error) {
      console.error("❌ Error in document ingestion:", error);
      throw error;
    }
  }
  async similaritySearch(query: string, userId: string, k: number = 4) {
    console.log("📝 Starting similarity search for:", query);
    console.log("🔑 Filtering for userId:", userId);
    try {
      const index = this.pineconeClient.Index(process.env.PINECONE_INDEX_NAME!);

      const queryEmbedding = await this.embeddings.embedQuery(query);

      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: k,
        includeMetadata: true,
        includeValues: true,
        filter: {
          userId: userId,
        },
      });

      console.log(
        "🔍 Query filter:",
        JSON.stringify({ userId: userId }, null, 2)
      );
      console.log(
        "🔍 Results with scores:",
        queryResponse.matches.map((match) => ({
          text: match.metadata?.text,
          score: match.score,
          timestamp: match.metadata?.timestamp,
        }))
      );

      const results = queryResponse.matches.map((match) => ({
        pageContent: match.metadata?.text || "",
        metadata: match.metadata || {},
        score: match.score,
      }));

      return results;
    } catch (error) {
      console.error("❌ Error in similarity search:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const langchainService = new LangChainService();
