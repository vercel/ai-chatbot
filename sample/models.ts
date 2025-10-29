import { AIModel } from '@/types/models';

export const huggingfaceModels: AIModel[] = [
    {
        id: 'openai/gpt-oss-120b:novita',
        name: 'GPT-OSS 120B',
        description: 'High-performance open source large language model',
        maxTokens: 32768,
        provider: 'huggingface',
        contextLength: 32768,
        pricing: {
            input: 0,
            output: 0,
        },
    },
];
