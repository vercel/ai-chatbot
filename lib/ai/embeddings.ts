import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

export async function getHuggingFaceEmbeddings(text: string) {
  const model = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
    maxConcurrency: 1
  });

  try {
    return await model.embedQuery(text);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}
