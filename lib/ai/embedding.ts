import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const embeddingModel = openai.embedding('text-embedding-3-small');

/**
 * Splits input text into smaller chunks.
 * This is a simple implementation that splits by periods.
 * For production use cases, consider more sophisticated chunking strategies.
 */
export const generateChunks = (input: string): string[] => {
  return (
    input
      .trim()
      .split('.')
      .filter((i) => i !== '')
      // Add period back to each chunk for better semantic meaning
      .map((chunk) => `${chunk.trim()}.`)
  );
};

/**
 * Generates embeddings for a piece of text content
 * First chunks the content, then generates embeddings for each chunk
 */
export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  try {
    const chunks = generateChunks(value);

    if (chunks.length === 0) {
      console.log('No valid chunks generated from the input text');
      return [];
    }

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    });

    return embeddings.map((embedding, i) => ({
      content: chunks[i],
      embedding,
    }));
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
};
