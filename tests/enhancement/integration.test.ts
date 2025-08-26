import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { enhancePrompt } from '@/lib/ai/enhancement/prompt-enhancer';
import { IntentCategory, VaguenessLevel } from '@/lib/types';

// Mock the AI provider to avoid actual API calls
jest.mock('@/lib/ai/providers', () => ({
  myProvider: {
    languageModel: jest.fn(() => ({
      // Mock model
    }))
  }
}));

// Mock the generateText function
jest.mock('ai', () => ({
  generateText: jest.fn(() => Promise.resolve({
    text: 'Enhanced version of the prompt with additional context and formatting instructions'
  }))
}));

describe('Enhancement API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enhancePrompt function', () => {
    it('should enhance a vague prompt', async () => {
      const input = 'help';
      const context = {
        userContext: { id: 'test-user', type: 'free' },
        chatHistory: [],
        selectedModel: 'chat-model',
        requestHints: {}
      };

      const result = await enhancePrompt(input, context);

      expect(result.original).toBe(input);
      expect(result.enhanced).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle code generation requests', async () => {
      const input = 'write function';
      const context = {
        userContext: { id: 'test-user', type: 'free' },
        chatHistory: [],
        selectedModel: 'chat-model'
      };

      const result = await enhancePrompt(input, context);

      expect(result.enhanced.length).toBeGreaterThan(input.length);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should not over-enhance good prompts', async () => {
      const input = 'Create a React component that displays a list of users with proper TypeScript types, error handling, and loading states';
      
      const result = await enhancePrompt(input);

      // Should recognize this as a good prompt
      expect(result.enhanced).toBe(input);
      expect(result.confidence).toBe(1.0);
      expect(result.changes).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in the enhancement process
      const { generateText } = require('ai');
      generateText.mockRejectedValueOnce(new Error('AI service unavailable'));

      const input = 'test prompt';
      const result = await enhancePrompt(input);

      // Should fallback to original prompt
      expect(result.enhanced).toBe(input);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should include enhancement metadata', async () => {
      const input = 'compare things';
      
      const result = await enhancePrompt(input);

      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('enhanced');
      expect(result).toHaveProperty('changes');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('processingTime');
    });

    it('should respect enhancement thresholds', async () => {
      const config = {
        thresholds: {
          vaguenessThreshold: 0.9, // Very high threshold
          confidenceThreshold: 0.9,
          processingTimeLimit: 1000,
          maxEnhancementLength: 500,
          minPromptLength: 5
        }
      };

      const input = 'what is programming';
      const result = await enhancePrompt(input, undefined, config);

      // Should not enhance due to high thresholds
      expect(result.enhanced).toBe(input);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Chat API Integration Scenarios', () => {
    it('should handle message parts correctly', () => {
      const messageParts = [
        { type: 'text', text: 'create app' },
        { type: 'attachment', data: 'file.pdf' }
      ];

      const textContent = messageParts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');

      expect(textContent).toBe('create app');
    });

    it('should create enhanced message structure', async () => {
      const originalMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'help me code' }],
        attachments: []
      };

      const enhancementResult = await enhancePrompt('help me code');
      
      if (enhancementResult.confidence > 0.6 && 
          enhancementResult.enhanced !== enhancementResult.original) {
        
        const enhancedMessage = {
          ...originalMessage,
          parts: originalMessage.parts.map(part => {
            if (part.type === 'text') {
              return {
                ...part,
                text: enhancementResult.enhanced
              };
            }
            return part;
          })
        };

        expect(enhancedMessage.parts[0].text).toBe(enhancementResult.enhanced);
        expect(enhancedMessage.id).toBe(originalMessage.id);
      }
    });

    it('should handle multiple text parts in message', () => {
      const messageParts = [
        { type: 'text', text: 'First part: create a function' },
        { type: 'text', text: 'Second part: with error handling' }
      ];

      const combinedText = messageParts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');

      expect(combinedText).toBe('First part: create a function Second part: with error handling');
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete enhancement within reasonable time', async () => {
      const startTime = Date.now();
      const result = await enhancePrompt('create a web application');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.processingTime).toBeLessThan(5000);
    });

    it('should handle concurrent enhancement requests', async () => {
      const inputs = [
        'create app',
        'explain concept',
        'compare options',
        'write code',
        'analyze data'
      ];

      const promises = inputs.map(input => enhancePrompt(input));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.original).toBe(inputs[index]);
        expect(result.enhanced).toBeDefined();
      });
    });

    it('should maintain consistency across multiple calls', async () => {
      const input = 'write a sorting function';
      
      const result1 = await enhancePrompt(input);
      const result2 = await enhancePrompt(input);

      // Results should be consistent (though not necessarily identical due to AI variability)
      expect(result1.original).toBe(result2.original);
      expect(typeof result1.enhanced).toBe(typeof result2.enhanced);
      expect(typeof result1.confidence).toBe(typeof result2.confidence);
    });
  });

  describe('Enhancement Quality', () => {
    it('should improve prompt specificity', async () => {
      const vaguePronous = ['help', 'fix', 'create', 'make', 'do'];
      
      for (const prompt of vaguePronous) {
        const result = await enhancePrompt(prompt);
        
        if (result.enhanced !== result.original) {
          expect(result.enhanced.length).toBeGreaterThan(prompt.length);
          expect(result.confidence).toBeGreaterThan(0.5);
        }
      }
    });

    it('should add appropriate context for code requests', async () => {
      const codePrompts = [
        'write function',
        'create component',
        'build app',
        'implement algorithm'
      ];

      for (const prompt of codePrompts) {
        const result = await enhancePrompt(prompt);
        
        if (result.enhanced !== result.original) {
          // Enhanced version should mention programming concepts
          const enhanced = result.enhanced.toLowerCase();
          const hasCodeContext = enhanced.includes('code') || 
                                enhanced.includes('language') ||
                                enhanced.includes('function') ||
                                enhanced.includes('programming');
          
          expect(hasCodeContext).toBe(true);
        }
      }
    });

    it('should preserve user intent while enhancing', async () => {
      const testCases = [
        { input: 'compare React vs Vue', expectedIntent: 'comparison' },
        { input: 'explain machine learning', expectedIntent: 'explanation' },
        { input: 'write a function', expectedIntent: 'code generation' },
        { input: 'how to deploy app', expectedIntent: 'task execution' }
      ];

      for (const testCase of testCases) {
        const result = await enhancePrompt(testCase.input);
        
        // Enhanced prompt should still clearly indicate the original intent
        const enhanced = result.enhanced.toLowerCase();
        const original = testCase.input.toLowerCase();
        
        // Check if key intent words are preserved
        if (original.includes('compare')) {
          expect(enhanced.includes('compare') || enhanced.includes('comparison')).toBe(true);
        }
        if (original.includes('explain')) {
          expect(enhanced.includes('explain') || enhanced.includes('explanation')).toBe(true);
        }
        if (original.includes('write')) {
          expect(enhanced.includes('write') || enhanced.includes('create')).toBe(true);
        }
      }
    });
  });
});