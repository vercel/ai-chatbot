import PipelineSingleton from './pipeline';

export async function getHuggingFaceEmbeddings(text: string) {
  try {
    // Get the pipeline instance
    const embeddingPipeline = await PipelineSingleton.getInstance();
    
    if (!embeddingPipeline) {
      throw new Error('Failed to initialize embedding pipeline');
    }

    // Generate embeddings
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to array and return
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}