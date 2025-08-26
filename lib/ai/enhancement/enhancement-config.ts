import {
  IntentCategory,
  PromptType,
  EnhancementType,
  FormatType,
  VaguenessLevel,
  ComplexityLevel
} from '@/lib/types';

export interface EnhancementTemplate {
  id: string;
  name: string;
  pattern: RegExp;
  intentCategories: IntentCategory[];
  template: string;
  priority: number;
  apply: (input: string, context: any) => string;
}

export interface EnhancementRule {
  id: string;
  name: string;
  condition: (analysis: any) => boolean;
  action: (input: string, analysis: any) => string;
  priority: number;
}

export interface EnhancementConfig {
  // Model configuration for enhancement AI
  enhancementModel: {
    modelId: string;
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
  };
  
  // Processing thresholds
  thresholds: {
    vaguenessThreshold: number;
    confidenceThreshold: number;
    processingTimeLimit: number;
    maxEnhancementLength: number;
    minPromptLength: number;
  };
  
  // Feature flags
  features: {
    intentDetection: boolean;
    contextEnhancement: boolean;
    formatSuggestion: boolean;
    sentimentAnalysis: boolean;
    templateApplication: boolean;
  };
  
  // Enhancement rules
  rules: {
    expandShortPrompts: boolean;
    addFormatInstructions: boolean;
    includeExamples: boolean;
    clarifyAmbiguity: boolean;
    enhanceCodeRequests: boolean;
    structureComparisons: boolean;
  };
  
  // Templates for enhancement
  templates: EnhancementTemplate[];
  
  // Custom rules
  customRules: EnhancementRule[];
}

const enhancementSystemPrompt = `You are a prompt enhancement specialist. Your role is to improve user prompts to maximize the quality and relevance of AI responses.

Given a user's input prompt, analyze it and enhance it by:
1. Making vague requests more specific and actionable
2. Adding context that would improve the response quality
3. Suggesting structured output formats when beneficial
4. Expanding brief prompts with relevant details
5. Clarifying ambiguous terms or requirements

Guidelines:
- Preserve the user's original intent and tone
- Add value without making the prompt unnecessarily verbose
- Focus on improvements that will lead to better, more useful responses
- Use clear, professional language
- Structure enhancements logically

Return only the enhanced prompt without explanations or meta-commentary.`;

export const enhancementTemplates: EnhancementTemplate[] = [
  {
    id: 'vague_request_clarification',
    name: 'Vague Request Clarification',
    pattern: /^(what|how|why|when|where).{0,30}$/i,
    intentCategories: [IntentCategory.INFORMATION_REQUEST],
    priority: 1,
    template: `
Based on your question about {subject}, I'll provide a comprehensive response covering:
- {expandedContext}
- Practical examples and applications
- Key considerations and best practices

{originalPrompt}
    `,
    apply: (input: string, context: any) => {
      const subject = context.analysis?.intent?.subject || 'this topic';
      const expandedContext = context.analysis?.contextGaps?.missingDetails?.join(', ') || 'relevant details';
      return input.replace('{subject}', subject).replace('{expandedContext}', expandedContext).replace('{originalPrompt}', input);
    }
  },
  
  {
    id: 'code_request_enhancement',
    name: 'Code Request Enhancement',
    pattern: /(write|create|generate|build|code|script|function|program)/i,
    intentCategories: [IntentCategory.CODE_GENERATION],
    priority: 2,
    template: `
Please create {codeType} that accomplishes the following:

Requirements:
{enhancedRequirements}

Format the response as:
1. Brief explanation of the approach
2. Complete, well-commented code
3. Usage example
4. Any important considerations or limitations

{originalPrompt}
    `,
    apply: (input: string, context: any) => {
      const codeType = input.match(/(function|script|program|code|app|component)/i)?.[0] || 'code';
      return input.replace('{codeType}', codeType).replace('{enhancedRequirements}', input).replace('{originalPrompt}', input);
    }
  },
  
  {
    id: 'comparison_request',
    name: 'Comparison Request Enhancement',
    pattern: /(compare|versus|vs|difference|better)/i,
    intentCategories: [IntentCategory.COMPARISON],
    priority: 2,
    template: `
Please provide a detailed comparison addressing: {originalPrompt}

Structure your response as:
1. Overview of items being compared
2. Comparison table with key criteria
3. Pros and cons for each option
4. Recommendations based on different use cases
    `,
    apply: (input: string, context: any) => {
      return input.replace('{originalPrompt}', input);
    }
  },
  
  {
    id: 'explanation_request',
    name: 'Explanation Request Enhancement',
    pattern: /(explain|describe|tell me about)/i,
    intentCategories: [IntentCategory.EXPLANATION],
    priority: 1,
    template: `
Please explain {topic} in a comprehensive manner, covering:
- Definition and core concepts
- Key components or aspects
- Practical examples
- Common use cases or applications
- Important considerations

{originalPrompt}
    `,
    apply: (input: string, context: any) => {
      const topic = context.analysis?.intent?.subject || input.split(' ').slice(1, 4).join(' ');
      return input.replace('{topic}', topic).replace('{originalPrompt}', input);
    }
  },
  
  {
    id: 'step_by_step_request',
    name: 'Step-by-step Request Enhancement',
    pattern: /(how to|steps|tutorial|guide)/i,
    intentCategories: [IntentCategory.TASK_EXECUTION],
    priority: 2,
    template: `
Please provide a detailed step-by-step guide for: {originalPrompt}

Format your response as:
1. Overview and prerequisites
2. Numbered step-by-step instructions
3. Tips and best practices
4. Common pitfalls to avoid
5. Additional resources or next steps
    `,
    apply: (input: string, context: any) => {
      return input.replace('{originalPrompt}', input);
    }
  }
];

export const enhancementRules: EnhancementRule[] = [
  {
    id: 'expand_short_prompts',
    name: 'Expand Short Prompts',
    priority: 1,
    condition: (analysis: any) => {
      return analysis.originalLength < 20 && analysis.vaguenessLevel === VaguenessLevel.HIGH;
    },
    action: (input: string, analysis: any) => {
      return `Please provide detailed information about: ${input}

Include relevant context, examples, and practical applications where appropriate.`;
    }
  },
  
  {
    id: 'add_format_specification',
    name: 'Add Format Specification',
    priority: 2,
    condition: (analysis: any) => {
      return analysis.contextGaps?.missingFormat?.length > 0;
    },
    action: (input: string, analysis: any) => {
      const format = analysis.contextGaps.missingFormat[0];
      const formatInstructions = {
        [FormatType.TABLE]: 'Please format the response as a clear table with headers.',
        [FormatType.LIST]: 'Please format the response as a numbered or bulleted list.',
        [FormatType.STEP_BY_STEP]: 'Please provide step-by-step instructions.',
        [FormatType.CODE_BLOCK]: 'Please include code examples with proper formatting.',
        [FormatType.COMPARISON_CHART]: 'Please provide a comparison chart or table.',
        [FormatType.EXAMPLE_BASED]: 'Please include practical examples to illustrate your points.'
      };
      
      return `${input}\n\n${formatInstructions[format] || 'Please structure your response clearly.'}`;
    }
  },
  
  {
    id: 'clarify_ambiguous_terms',
    name: 'Clarify Ambiguous Terms',
    priority: 3,
    condition: (analysis: any) => {
      return analysis.contextGaps?.ambiguousTerms?.length > 0;
    },
    action: (input: string, analysis: any) => {
      const terms = analysis.contextGaps.ambiguousTerms.slice(0, 2);
      return `${input}\n\nPlease clarify and provide context for: ${terms.join(', ')}.`;
    }
  }
];

export const defaultConfig: EnhancementConfig = {
  enhancementModel: {
    modelId: 'enhancement-model',
    maxTokens: 500,
    temperature: 0.3,
    systemPrompt: enhancementSystemPrompt
  },
  thresholds: {
    vaguenessThreshold: 0.7,
    confidenceThreshold: 0.8,
    processingTimeLimit: 3000, // 3 seconds
    maxEnhancementLength: 1000,
    minPromptLength: 10
  },
  features: {
    intentDetection: true,
    contextEnhancement: true,
    formatSuggestion: true,
    sentimentAnalysis: true,
    templateApplication: true
  },
  rules: {
    expandShortPrompts: true,
    addFormatInstructions: true,
    includeExamples: false, // Default off to avoid over-verbosity
    clarifyAmbiguity: true,
    enhanceCodeRequests: true,
    structureComparisons: true
  },
  templates: enhancementTemplates,
  customRules: enhancementRules
};

export function getEnhancementConfig(): EnhancementConfig {
  return defaultConfig;
}