import { pipeline, env, Pipeline } from '@huggingface/transformers';
import type { FeatureExtractionPipeline, ProgressCallback } from '@huggingface/transformers';

// Skip local model check
env.allowLocalModels = false;

// Use Singleton pattern to enable lazy construction of the pipeline
class PipelineSingleton {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: FeatureExtractionPipeline | null = null;

  static async getInstance(progress_callback?: ProgressCallback) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

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
