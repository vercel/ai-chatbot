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
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text], [metadata]);

    const index = this.pineconeClient.Index(process.env.PINECONE_INDEX_NAME!);

    await PineconeStore.fromDocuments(docs, this.embeddings, {
      pineconeIndex: index,
      namespace: process.env.PINECONE_NAMESPACE,
    });

    return docs.length;
  }

  async similaritySearch(query: string, k: number = 4) {
    const index = this.pineconeClient.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex: index,
    });

    const results = await vectorStore.similaritySearch(query, k);
    return results;
  }
}

// Create singleton instance
export const langchainService = new LangChainService();
