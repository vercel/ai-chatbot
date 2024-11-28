import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

export async function getHuggingFaceEmbeddings(text: string) {
  const model = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });

  return await model.embedQuery(text);
}
