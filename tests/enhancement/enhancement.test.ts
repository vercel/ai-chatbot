import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { IntentDetector } from '@/lib/ai/enhancement/intent-detector';
import { ContextAnalyzer } from '@/lib/ai/enhancement/context-analyzer';
import { TemplateEngine } from '@/lib/ai/enhancement/template-engine';
import { PromptEnhancer } from '@/lib/ai/enhancement/prompt-enhancer';
import { 
  IntentCategory, 
  VaguenessLevel, 
  ComplexityLevel, 
  EnhancementType,
  FormatType,
  PromptType
} from '@/lib/types';
import { getEnhancementConfig } from '@/lib/ai/enhancement/enhancement-config';

// Mock the AI provider to avoid actual API calls during tests
jest.mock('@/lib/ai/providers', () => ({
  myProvider: {
    languageModel: jest.fn(() => ({
      // Mock model response
    }))
  }
}));

// Mock the generateText function from AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(() => Promise.resolve({
    text: 'Enhanced prompt based on analysis'
  }))
}));

describe('Intent Detection Engine', () => {
  let intentDetector: IntentDetector;

  beforeEach(() => {
    intentDetector = new IntentDetector();
  });

  describe('detectIntent', () => {
    it('should detect code generation intent', () => {
      const input = 'write a function to sort an array';
      const result = intentDetector.detectIntent(input);
      
      expect(result.category).toBe(IntentCategory.CODE_GENERATION);
      expect(result.action).toContain('create');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect information request intent', () => {
      const input = 'what is machine learning?';
      const result = intentDetector.detectIntent(input);
      
      expect(result.category).toBe(IntentCategory.INFORMATION_REQUEST);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect comparison intent', () => {
      const input = 'compare React vs Angular';
      const result = intentDetector.detectIntent(input);
      
      expect(result.category).toBe(IntentCategory.COMPARISON);
      expect(result.subject).toContain('React');
      expect(result.subject).toContain('Angular');
    });

    it('should detect task execution intent', () => {
      const input = 'how to deploy a React app to production';
      const result = intentDetector.detectIntent(input);
      
      expect(result.category).toBe(IntentCategory.TASK_EXECUTION);
      expect(result.action).toBe('provide steps');
    });

    it('should handle vague input with low confidence', () => {
      const input = 'help';
      const result = intentDetector.detectIntent(input);
      
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.category).toBe(IntentCategory.INFORMATION_REQUEST);
    });
  });

  describe('classifyType', () => {
    it('should classify vague inquiries', () => {
      const input = 'what?';
      const result = intentDetector.classifyType(input);
      
      expect(result).toBe(PromptType.VAGUE_INQUIRY);
    });

    it('should classify multi-part requests', () => {
      const input = 'Explain machine learning and also provide code examples';
      const result = intentDetector.classifyType(input);
      
      expect(result).toBe(PromptType.MULTI_PART_REQUEST);
    });

    it('should classify specific tasks', () => {
      const input = 'Create a React component that fetches data from an API';
      const result = intentDetector.classifyType(input);
      
      expect(result).toBe(PromptType.SPECIFIC_TASK);
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords', () => {
      const input = 'Create a machine learning model for image classification';
      const keywords = intentDetector.extractKeywords(input);
      
      expect(keywords).toContain('machine');
      expect(keywords).toContain('learning');
      expect(keywords).toContain('image');
      expect(keywords).toContain('classification');
      expect(keywords.length).toBeLessThanOrEqual(5);
    });

    it('should filter out stop words', () => {
      const input = 'What is the best way to do this?';
      const keywords = intentDetector.extractKeywords(input);
      
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('to');
    });
  });
});

describe('Context Analysis Engine', () => {
  let contextAnalyzer: ContextAnalyzer;

  beforeEach(() => {
    contextAnalyzer = new ContextAnalyzer();
  });

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const input = 'Please help me create an awesome application';
      const result = contextAnalyzer.analyzeSentiment(input);
      
      expect(result.polarity).toBe('positive');
      expect(result.intensity).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const input = 'This is not working and I am frustrated';
      const result = contextAnalyzer.analyzeSentiment(input);
      
      expect(result.polarity).toBe('negative');
      expect(result.emotion).toBeDefined();
    });

    it('should detect neutral sentiment', () => {
      const input = 'Explain the concept of variables in programming';
      const result = contextAnalyzer.analyzeSentiment(input);
      
      expect(result.polarity).toBe('neutral');
    });
  });

  describe('detectVagueness', () => {
    it('should detect high vagueness in short unclear prompts', () => {
      const input = 'what?';
      const result = contextAnalyzer.detectVagueness(input);
      
      expect(result).toBe(VaguenessLevel.HIGH);
    });

    it('should detect low vagueness in specific prompts', () => {
      const input = 'Create a React component with TypeScript that fetches user data from a REST API using axios and displays it in a table format';
      const result = contextAnalyzer.detectVagueness(input);
      
      expect(result).toBe(VaguenessLevel.LOW);
    });

    it('should detect medium vagueness', () => {
      const input = 'help me with programming';
      const result = contextAnalyzer.detectVagueness(input);
      
      expect(result).toBe(VaguenessLevel.MEDIUM);
    });
  });

  describe('identifyMissingContext', () => {
    it('should identify missing format for comparison requests', () => {
      const input = 'compare React and Vue';
      const result = contextAnalyzer.identifyMissingContext(input);
      
      expect(result.missingFormat).toContain(FormatType.TABLE);
      expect(result.missingFormat).toContain(FormatType.COMPARISON_CHART);
    });

    it('should identify missing details for code requests', () => {
      const input = 'write code';
      const result = contextAnalyzer.identifyMissingContext(input);
      
      expect(result.missingDetails).toContain('programming language');
      expect(result.missingDetails).toContain('specific requirements');
    });

    it('should identify ambiguous terms', () => {
      const input = 'make this better and improve that thing';
      const result = contextAnalyzer.identifyMissingContext(input);
      
      expect(result.ambiguousTerms).toContain('this');
      expect(result.ambiguousTerms).toContain('that');
    });
  });

  describe('assessComplexity', () => {
    it('should assess simple prompts as simple', () => {
      const input = 'Hello world';
      const result = contextAnalyzer.assessComplexity(input);
      
      expect(result).toBe(ComplexityLevel.SIMPLE);
    });

    it('should assess complex prompts correctly', () => {
      const input = 'Create a microservices architecture with authentication, database optimization, and deployment automation using Docker and Kubernetes';
      const result = contextAnalyzer.assessComplexity(input);
      
      expect(result).toBe(ComplexityLevel.COMPLEX);
    });
  });
});

describe('Template Engine', () => {
  let templateEngine: TemplateEngine;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = getEnhancementConfig();
    templateEngine = new TemplateEngine(mockConfig);
  });

  describe('findMatchingTemplates', () => {
    it('should find templates for code generation', () => {
      const analysis = {
        intent: {
          category: IntentCategory.CODE_GENERATION,
          action: 'create',
          subject: 'function',
          confidence: 0.8
        },
        vaguenessLevel: VaguenessLevel.LOW,
        complexity: ComplexityLevel.MODERATE,
        contextGaps: { missingFormat: [], missingDetails: [], ambiguousTerms: [], implicitRequirements: [] },
        promptType: PromptType.SPECIFIC_TASK,
        keywords: ['function', 'create']
      };
      
      const input = 'create a function';
      const templates = templateEngine.findMatchingTemplates(analysis as any, input);
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].intentCategories).toContain(IntentCategory.CODE_GENERATION);
    });

    it('should find templates for comparison requests', () => {
      const analysis = {
        intent: {
          category: IntentCategory.COMPARISON,
          action: 'compare',
          subject: 'frameworks',
          confidence: 0.8
        },
        vaguenessLevel: VaguenessLevel.MEDIUM,
        complexity: ComplexityLevel.MODERATE,
        contextGaps: { missingFormat: [], missingDetails: [], ambiguousTerms: [], implicitRequirements: [] },
        promptType: PromptType.SINGLE_QUESTION,
        keywords: ['compare', 'frameworks']
      };
      
      const input = 'compare React vs Vue';
      const templates = templateEngine.findMatchingTemplates(analysis as any, input);
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].intentCategories).toContain(IntentCategory.COMPARISON);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template successfully', () => {
      const template = mockConfig.templates[0]; // vague_request_clarification
      const analysis = {
        intent: { subject: 'programming', action: 'explain', category: IntentCategory.INFORMATION_REQUEST, confidence: 0.8 },
        contextGaps: { missingDetails: ['context', 'examples'] }
      };
      
      const result = templateEngine.applyTemplate(template, 'what is programming?', analysis as any);
      
      expect(result.result).toContain('programming');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Template utility methods', () => {
    it('should expand template variables', () => {
      const template = 'Hello {name}, welcome to {place}';
      const variables = { name: 'John', place: 'our app' };
      const result = TemplateEngine.expandTemplate(template, variables);
      
      expect(result).toBe('Hello John, welcome to our app');
    });

    it('should extract template variables', () => {
      const template = 'Process {input} and generate {output} with {method}';
      const variables = TemplateEngine.extractVariables(template);
      
      expect(variables).toEqual(['input', 'output', 'method']);
    });
  });
});

describe('Prompt Enhancer Integration', () => {
  let promptEnhancer: PromptEnhancer;

  beforeEach(() => {
    // Use a test configuration with disabled AI calls
    const testConfig = {
      ...getEnhancementConfig(),
      features: {
        intentDetection: true,
        contextEnhancement: false, // Disable AI enhancement for tests
        formatSuggestion: true,
        sentimentAnalysis: true,
        templateApplication: true
      }
    };
    promptEnhancer = new PromptEnhancer(testConfig);
  });

  describe('process', () => {
    it('should handle empty input gracefully', async () => {
      const result = await promptEnhancer.process('');
      
      expect(result.original).toBe('');
      expect(result.enhanced).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should enhance vague prompts', async () => {
      const input = 'help';
      const result = await promptEnhancer.process(input);
      
      expect(result.original).toBe(input);
      expect(result.enhanced.length).toBeGreaterThan(input.length);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should not enhance good prompts unnecessarily', async () => {
      const input = 'Create a React component that displays a list of users fetched from a REST API endpoint, with proper error handling and loading states';
      const result = await promptEnhancer.process(input);
      
      // Should not enhance an already good prompt
      expect(result.enhanced).toBe(input);
      expect(result.confidence).toBe(1.0);
    });

    it('should enhance code requests with missing details', async () => {
      const input = 'write code';
      const result = await promptEnhancer.process(input);
      
      expect(result.enhanced).toContain('programming language');
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('analyze', () => {
    it('should analyze prompt correctly', async () => {
      const input = 'compare React and Vue performance';
      const analysis = await promptEnhancer.analyze(input);
      
      expect(analysis.intent.category).toBe(IntentCategory.COMPARISON);
      expect(analysis.vaguenessLevel).toBe(VaguenessLevel.LOW);
      expect(analysis.keywords).toContain('react');
      expect(analysis.contextGaps.missingFormat).toContain(FormatType.TABLE);
    });

    it('should handle analysis errors gracefully', async () => {
      // Mock analysis to throw error
      const originalDetectIntent = promptEnhancer['intentDetector'].detectIntent;
      promptEnhancer['intentDetector'].detectIntent = jest.fn(() => {
        throw new Error('Analysis failed');
      });
      
      const analysis = await promptEnhancer.analyze('test input');
      
      expect(analysis.intent.confidence).toBe(0.1);
      expect(analysis.intent.category).toBe(IntentCategory.INFORMATION_REQUEST);
      
      // Restore original method
      promptEnhancer['intentDetector'].detectIntent = originalDetectIntent;
    });
  });

  describe('configuration', () => {
    it('should update configuration correctly', () => {
      const newConfig = { thresholds: { vaguenessThreshold: 0.5 } };
      promptEnhancer.updateConfig(newConfig);
      
      const config = promptEnhancer.getConfig();
      expect(config.thresholds.vaguenessThreshold).toBe(0.5);
    });

    it('should provide test enhancement functionality', async () => {
      const input = 'create app';
      const testResult = await promptEnhancer.testEnhancement(input);
      
      expect(testResult.analysis).toBeDefined();
      expect(testResult.result).toBeDefined();
      expect(testResult.analysis.intent.category).toBe(IntentCategory.CODE_GENERATION);
    });
  });
});

describe('Enhancement Edge Cases', () => {
  let promptEnhancer: PromptEnhancer;

  beforeEach(() => {
    promptEnhancer = new PromptEnhancer();
  });

  it('should handle very long prompts', async () => {
    const longInput = 'a'.repeat(2000);
    const result = await promptEnhancer.process(longInput);
    
    expect(result.enhanced.length).toBeLessThanOrEqual(1000); // Should be truncated
    expect(result.confidence).toBeLessThan(1.0); // Confidence should be reduced
  });

  it('should handle prompts with special characters', async () => {
    const input = 'Create a function that handles @#$%^&*() characters';
    const result = await promptEnhancer.process(input);
    
    expect(result.enhanced).toContain('@#$%^&*()');
    expect(result.processingTime).toBeGreaterThan(0);
  });

  it('should handle prompts in mixed case', async () => {
    const input = 'CrEaTe A rEaCt CoMpOnEnT';
    const result = await promptEnhancer.process(input);
    
    expect(result.original).toBe(input);
    expect(result.enhanced).toBeDefined();
  });

  it('should handle timeout scenarios gracefully', async () => {
    // Mock a long-running enhancement
    const originalProcess = promptEnhancer['enhance'];
    promptEnhancer['enhance'] = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve({
        text: 'enhanced',
        changes: [],
        confidence: 0.5
      }), 5000))
    );
    
    const startTime = Date.now();
    const result = await promptEnhancer.process('test input');
    const processingTime = Date.now() - startTime;
    
    expect(processingTime).toBeLessThan(4000); // Should not wait for full timeout
    expect(result).toBeDefined();
    
    // Restore original method
    promptEnhancer['enhance'] = originalProcess;
  });
});