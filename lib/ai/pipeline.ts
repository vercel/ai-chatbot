import { pipeline, FeatureExtractionPipeline, ProgressCallback } from "@huggingface/transformers";

// Declare global types for development hot reloading
declare global {
  var PipelineSingleton: PipelineSingletonType;
}

// Define the type for our Singleton class
type PipelineSingletonType = {
  new(): void; // Constructor signature
} & {
  task: 'feature-extraction';
  model: string;
  instance: FeatureExtractionPipeline | null;
  getInstance(progress_callback?: ProgressCallback): Promise<FeatureExtractionPipeline>;
};

// Use the Singleton pattern to enable lazy construction of the pipeline
const P = (): PipelineSingletonType => {
  return class {
    static task = 'feature-extraction' as const;
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: FeatureExtractionPipeline | null = null;

    static async getInstance(progress_callback?: ProgressCallback) {
      if (this.instance === null) {
        this.instance = await pipeline(this.task, this.model, { progress_callback });
      }
      return this.instance;
    }
  } as unknown as PipelineSingletonType;
};

// Handle development hot reloading
let PipelineSingleton: PipelineSingletonType;
if (process.env.NODE_ENV !== 'production') {
  if (!global.PipelineSingleton) {
    global.PipelineSingleton = P();
  }
  PipelineSingleton = global.PipelineSingleton;
} else {
  PipelineSingleton = P();
}

export default PipelineSingleton;