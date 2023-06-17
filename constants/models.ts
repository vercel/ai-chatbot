export const allModelTypes = ['GPT-3', 'GPT-3.5', 'GPT-4'] as const
export const types = ['GPT-3.5', 'GPT-4'] as const

export type ModelType = typeof allModelTypes[number]

export type Compatibility =
  | 'completions'
  | 'chat'
  | 'edits'
  | 'fine-tunes'
  | 'embeddings'
  | 'moderations'

export interface Model<Type = string> {
  id: string
  name: string
  description: string
  strengths?: string
  type: Type
  tokens: string
  compatibility: Compatibility
}

export const openAImodels: Model<ModelType>[] = [
  {
    id: 'gpt-3.5-turbo',
    name: 'gpt-3.5-turbo',
    description:
      'Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003. Will be updated with our latest model iteration 2 weeks after it is released.',
    type: 'GPT-3.5',
    compatibility: 'chat',
    tokens: '4,096 tokens',
    strengths: 'Optimized for chat, cost-effective, regularly updated'
  },
  {
    id: 'gpt-3.5-turbo-16k',
    name: 'gpt-3.5-turbo-16k',
    description:
      'Same capabilities as the standard gpt-3.5-turbo model but with 4 times the context.',
    type: 'GPT-3.5',
    compatibility: 'chat',
    tokens: '16,384 tokens',
    strengths: 'Extended context capabilities'
  },
  {
    id: 'gpt-3.5-turbo-0613',
    name: 'gpt-3.5-turbo-0613',
    description:
      'Snapshot of gpt-3.5-turbo from June 13th 2023 with function calling data. Unlike gpt-3.5-turbo, this model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: 'GPT-3.5',
    compatibility: 'chat',
    tokens: '4,096 tokens',
    strengths: 'Function calling data, snapshot model'
  },
  {
    id: 'gpt-3.5-turbo-16k-0613',
    name: 'gpt-3.5-turbo-16k-0613',
    description:
      'Snapshot of gpt-3.5-turbo-16k from June 13th 2023. Unlike gpt-3.5-turbo-16k, this model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: 'GPT-3.5',
    compatibility: 'chat',
    tokens: '16,384 tokens',
    strengths: 'Extended context capabilities, snapshot model'
  },
  {
    id: 'text-davinci-002',
    name: 'text-davinci-002',
    description:
      'Similar capabilities to text-davinci-003 but trained with supervised fine-tuning instead of reinforcement learning',
    type: 'GPT-3.5',
    compatibility: 'completions',
    tokens: '4,097 tokens',
    strengths: 'Supervised fine-tuning training'
  },
  {
    id: 'text-davinci-003',
    name: 'text-davinci-003',
    description:
      'Can do any language task with better quality, longer output, and consistent instruction-following than the curie, babbage, or ada models. Also supports some additional features such as inserting text.',
    type: 'GPT-3.5',
    compatibility: 'completions',
    tokens: '4,097 tokens',
    strengths:
      'High-quality language tasks, longer output, consistent instruction-following, additional features'
  },
  {
    id: 'code-davinci-002',
    name: 'code-davinci-002',
    description: 'Optimized for code-completion tasks',
    type: 'GPT-3.5',
    compatibility: 'completions',
    tokens: '8,001 tokens',
    strengths: 'Optimized for code-completion tasks'
  },
  {
    id: 'gpt-4',
    name: 'gpt-4',
    description:
      'Improves on GPT-3.5 and can understand and generate natural language or code. Optimized for chat but works well for traditional completions tasks.',
    type: 'GPT-4',
    compatibility: 'chat',
    tokens: '8,192 tokens',
    strengths:
      'Improved language and code understanding, optimized for chat and traditional completions'
  },
  {
    id: 'gpt-4-0613',
    name: 'gpt-4-0613',
    description:
      'Snapshot of gpt-4 from June 13th 2023 with function calling data. This model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: 'GPT-4',
    tokens: '8,192 tokens',
    compatibility: 'chat',
    strengths: 'Function calling data, snapshot model'
  },
  {
    id: 'gpt-4-32k',
    name: 'gpt-4-32k',
    description:
      'Same capabilities as the base gpt-4 model but with 4x the context length.',
    type: 'GPT-4',
    compatibility: 'chat',
    tokens: '32,768 tokens',
    strengths: 'Extended context capabilities'
  },
  {
    id: 'gpt-4-32k-0613',
    name: 'gpt-4-32k-0613',
    description:
      'Snapshot of gpt-4-32 from June 13th 2023. This model will not receive updates, and will be deprecated 3 months after a new version is released.',
    type: 'GPT-4',
    compatibility: 'chat',
    tokens: '32,768 tokens',
    strengths: 'Extended context capabilities, snapshot model'
  },

  {
    id: 'text-curie-001',
    name: 'text-curie-001',
    description: 'Very capable, faster and lower cost than Davinci.',
    type: 'GPT-3',
    compatibility: 'completions',
    tokens: '2,049 tokens',
    strengths: 'High capability, speed, cost-effectiveness'
  },
  {
    id: 'text-babbage-001',
    name: 'text-babbage-001',
    description: 'Capable of straightforward tasks, very fast, and lower cost.',
    type: 'GPT-3',
    compatibility: 'completions',
    tokens: '2,049 tokens',
    strengths: 'Straightforward tasks, speed, cost-effectiveness'
  },
  {
    id: 'text-ada-001',
    name: 'text-ada-001',
    description:
      'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
    type: 'GPT-3',
    compatibility: 'completions',
    tokens: '2,049 tokens',
    strengths: 'Simple tasks, speed, cost-effectiveness'
  },
  {
    id: 'davinci',
    name: 'davinci',
    description:
      'Most capable GPT-3 model. Can do any task the other models can do, often with higher quality.',
    type: 'GPT-3',
    compatibility: 'fine-tunes',
    tokens: '2,049 tokens',
    strengths: 'High capability, versatile, high quality output'
  },
  {
    id: 'curie',
    name: 'curie',
    description: 'Very capable, but faster and lower cost than Davinci.',
    type: 'GPT-3',
    compatibility: 'fine-tunes',
    tokens: '2,049 tokens',
    strengths: 'High capability, speed, cost-effectiveness'
  },
  {
    id: 'babbage',
    name: 'babbage',
    description: 'Capable of straightforward tasks, very fast, and lower cost.',
    type: 'GPT-3',
    compatibility: 'fine-tunes',
    tokens: '2,049 tokens',
    strengths: 'Straightforward tasks, speed, cost-effectiveness'
  },
  {
    id: 'ada',
    name: 'ada',
    description:
      'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
    type: 'GPT-3',
    compatibility: 'fine-tunes',
    tokens: '2,049 tokens',
    strengths: 'Simple tasks, speed, cost-effectiveness'
  }
]

export const models = openAImodels.filter(model => model.name.includes('gpt'))
