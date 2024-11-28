import { pipeline, env } from '@huggingface/transformers';
import type { FeatureExtractionPipeline, ProgressCallback } from '@huggingface/transformers';
import { mkdir } from 'fs/promises';

// Define cache directory in /tmp which is writable in Lambda
const CACHE_DIR = '/tmp/ai-embeddings-cache';

// Create cache directory if it doesn't exist
async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    // Set both cache environment variables used by transformers
    process.env.TRANSFORMERS_CACHE = CACHE_DIR;
    process.env.HF_HOME = CACHE_DIR;
  } catch (error) {
    console.warn('Failed to create cache directory:', error);
    // Fallback to memory-only operation if directory creation fails
    process.env.TRANSFORMERS_CACHE = 'memory';
    process.env.HF_HOME = 'memory';
  }
}

// Skip local model check
env.allowLocalModels = false;

// Modify the PipelineSingleton to ensure cache directory exists
class PipelineSingleton {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: FeatureExtractionPipeline | null = null;

  static async getInstance(progress_callback?: ProgressCallback) {
    if (this.instance === null) {
      await ensureCacheDir();
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
