import {
  PromptAnalysis,
  EnhancedPrompt,
  Enhancement,
  EnhancementContext,
  VaguenessLevel,
  ComplexityLevel,
  IntentCategory,
  ChatMessage
} from '@/lib/types';
import { IntentDetector } from './intent-detector';
import { ContextAnalyzer } from './context-analyzer';
import { EnhancementAI } from './enhancement-ai';
import { TemplateEngine } from './template-engine';
import { EnhancementConfig, getEnhancementConfig } from './enhancement-config';

export class PromptEnhancer {
  private intentDetector: IntentDetector;
  private contextAnalyzer: ContextAnalyzer;
  private enhancementAI: EnhancementAI;
  private templateEngine: TemplateEngine;
  private config: EnhancementConfig;

  constructor(config?: Partial<EnhancementConfig>) {
    this.config = { ...getEnhancementConfig(), ...config };
    this.intentDetector = new IntentDetector();
    this.contextAnalyzer = new ContextAnalyzer();
    this.enhancementAI = new EnhancementAI(this.config.enhancementModel);
    this.templateEngine = new TemplateEngine(this.config);
  }

  async process(input: string, context?: EnhancementContext): Promise<EnhancedPrompt> {
    const startTime = Date.now();
    
    try {
      // Input validation
      if (!input || input.trim().length === 0) {
        return this.createFallbackResult(input, startTime, 'Empty input');
      }

      if (input.length < this.config.thresholds.minPromptLength) {
        return this.createFallbackResult(input, startTime, 'Input too short');
      }

      // Step 1: Analyze the input
      const analysis = await this.analyze(input, context);
      
      // Step 2: Determine if enhancement is needed
      if (!this.shouldEnhance(analysis)) {
        return {
          original: input,
          enhanced: input,
          changes: [],
          confidence: 1.0,
          processingTime: Date.now() - startTime
        };
      }

      // Step 3: Apply enhancements
      const enhanced = await this.enhance(input, analysis, context);
      
      // Step 4: Validate enhanced result
      const validatedResult = this.validateEnhancement(input, enhanced, analysis);

      return {
        original: input,
        enhanced: validatedResult.text,
        changes: validatedResult.changes,
        confidence: validatedResult.confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Enhancement failed:', error);
      return this.createFallbackResult(input, startTime, 'Enhancement error');
    }
  }

  async analyze(input: string, context?: EnhancementContext): Promise<PromptAnalysis> {
    const normalizedInput = input.trim();
    
    try {
      // Run analysis components in parallel for better performance
      const [intent, sentiment, vaguenessLevel, contextGaps] = await Promise.all([
        Promise.resolve(this.intentDetector.detectIntent(normalizedInput)),
        Promise.resolve(this.contextAnalyzer.analyzeSentiment(normalizedInput)),
        Promise.resolve(this.contextAnalyzer.detectVagueness(normalizedInput)),
        Promise.resolve(this.contextAnalyzer.identifyMissingContext(normalizedInput, context))
      ]);

      const promptType = this.intentDetector.classifyType(normalizedInput);
      const keywords = this.intentDetector.extractKeywords(normalizedInput);
      const complexity = this.contextAnalyzer.assessComplexity(normalizedInput);

      return {
        intent,
        sentiment,
        vaguenessLevel,
        contextGaps,
        promptType,
        keywords,
        complexity
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      // Return minimal analysis as fallback
      return {
        intent: {
          category: IntentCategory.INFORMATION_REQUEST,
          action: 'request information',
          subject: 'unknown',
          confidence: 0.1
        },
        sentiment: { polarity: 'neutral', intensity: 0 },
        vaguenessLevel: VaguenessLevel.MEDIUM,
        contextGaps: { missingFormat: [], missingDetails: [], ambiguousTerms: [], implicitRequirements: [] },
        promptType: this.intentDetector.classifyType(normalizedInput),
        keywords: [],
        complexity: ComplexityLevel.SIMPLE
      };
    }
  }

  private shouldEnhance(analysis: PromptAnalysis): boolean {
    const { thresholds, features } = this.config;
    
    // Check if enhancement is disabled
    if (!features.intentDetection && !features.contextEnhancement && !features.formatSuggestion) {
      return false;
    }

    // Enhancement criteria
    const needsEnhancement = (
      // High vagueness
      (analysis.vaguenessLevel === VaguenessLevel.HIGH) ||
      
      // Missing context
      (features.contextEnhancement && (
        analysis.contextGaps.missingFormat.length > 0 ||
        analysis.contextGaps.missingDetails.length > 0 ||
        analysis.contextGaps.ambiguousTerms.length > 2
      )) ||
      
      // Low intent confidence
      (features.intentDetection && analysis.intent.confidence < thresholds.confidenceThreshold) ||
      
      // Format suggestions needed
      (features.formatSuggestion && analysis.contextGaps.missingFormat.length > 0)
    );

    return needsEnhancement;
  }

  private async enhance(
    input: string, 
    analysis: PromptAnalysis, 
    context?: EnhancementContext
  ): Promise<{ text: string; changes: Enhancement[]; confidence: number }> {
    let enhancedText = input;
    let allChanges: Enhancement[] = [];
    let overallConfidence = 0.5;

    try {
      // Strategy 1: Template-based enhancement (fast, rule-based)
      if (this.config.features.templateApplication) {
        const templateResult = this.templateEngine.processWithTemplatesAndRules(input, analysis, context);
        if (templateResult !== input) {
          enhancedText = templateResult;
          allChanges.push({
            type: 'STRUCTURE_IMPROVEMENT' as any,
            description: 'Applied enhancement templates',
            section: 'template',
            rationale: 'Template-based improvements for common patterns'
          });
          overallConfidence += 0.2;
        }
      }

      // Strategy 2: AI-based enhancement (slower, more sophisticated)
      if (this.config.features.contextEnhancement && this.shouldUseAIEnhancement(analysis)) {
        try {
          const aiResult = await this.enhancementAI.reformulate(enhancedText, analysis, context);
          if (aiResult.confidence > 0.6 && aiResult.text !== enhancedText) {
            enhancedText = aiResult.text;
            allChanges.push(...aiResult.changes);
            overallConfidence = Math.max(overallConfidence, aiResult.confidence);
          }
        } catch (aiError) {
          console.warn('AI enhancement failed, continuing with template result:', aiError);
        }
      }

      // Strategy 3: Specific improvements based on analysis
      const specificEnhancements = await this.applySpecificEnhancements(enhancedText, analysis, context);
      if (specificEnhancements.text !== enhancedText) {
        enhancedText = specificEnhancements.text;
        allChanges.push(...specificEnhancements.changes);
        overallConfidence += 0.1;
      }

    } catch (error) {
      console.error('Enhancement process failed:', error);
      // Fall back to original if enhancement fails
      enhancedText = input;
      allChanges = [];
      overallConfidence = 0;
    }

    return {
      text: enhancedText,
      changes: allChanges,
      confidence: Math.min(overallConfidence, 0.95)
    };
  }

  private shouldUseAIEnhancement(analysis: PromptAnalysis): boolean {
    // Use AI enhancement for complex cases or when templates aren't sufficient
    return (
      analysis.complexity === ComplexityLevel.COMPLEX ||
      analysis.vaguenessLevel === VaguenessLevel.HIGH ||
      analysis.intent.confidence < 0.6 ||
      analysis.contextGaps.missingDetails.length > 2
    );
  }

  private async applySpecificEnhancements(
    text: string, 
    analysis: PromptAnalysis, 
    context?: EnhancementContext
  ): Promise<{ text: string; changes: Enhancement[] }> {
    let enhancedText = text;
    const changes: Enhancement[] = [];

    // Code generation specific enhancements
    if (analysis.intent.category === IntentCategory.CODE_GENERATION && this.config.rules.enhanceCodeRequests) {
      const codeEnhanced = this.enhanceCodeRequest(enhancedText, analysis);
      if (codeEnhanced !== enhancedText) {
        enhancedText = codeEnhanced;
        changes.push({
          type: 'CONTEXT_ADDITION' as any,
          description: 'Added code-specific requirements',
          section: 'code',
          rationale: 'Code requests benefit from specific technical requirements'
        });
      }
    }

    // Comparison specific enhancements
    if (analysis.intent.category === IntentCategory.COMPARISON && this.config.rules.structureComparisons) {
      const comparisonEnhanced = this.enhanceComparisonRequest(enhancedText, analysis);
      if (comparisonEnhanced !== enhancedText) {
        enhancedText = comparisonEnhanced;
        changes.push({
          type: 'FORMAT_SPECIFICATION' as any,
          description: 'Added comparison structure requirements',
          section: 'format',
          rationale: 'Structured comparisons are more useful'
        });
      }
    }

    // Format specifications
    if (this.config.rules.addFormatInstructions && analysis.contextGaps.missingFormat.length > 0) {
      const formatEnhanced = this.addFormatInstructions(enhancedText, analysis);
      if (formatEnhanced !== enhancedText) {
        enhancedText = formatEnhanced;
        changes.push({
          type: 'FORMAT_SPECIFICATION' as any,
          description: 'Added output format specifications',
          section: 'format',
          rationale: 'Structured output improves usability'
        });
      }
    }

    return { text: enhancedText, changes };
  }

  private enhanceCodeRequest(text: string, analysis: PromptAnalysis): string {
    let enhanced = text;
    
    if (!text.toLowerCase().includes('language') && !text.toLowerCase().includes('javascript') && 
        !text.toLowerCase().includes('python') && !text.toLowerCase().includes('java')) {
      enhanced += '\n\nPlease specify the programming language and any relevant frameworks.';
    }
    
    if (!text.toLowerCase().includes('comment') && !text.toLowerCase().includes('documentation')) {
      enhanced += '\nInclude clear comments explaining the code logic.';
    }
    
    if (!text.toLowerCase().includes('error') && !text.toLowerCase().includes('exception')) {
      enhanced += '\nAdd appropriate error handling.';
    }
    
    return enhanced;
  }

  private enhanceComparisonRequest(text: string, analysis: PromptAnalysis): string {
    if (!text.toLowerCase().includes('table') && !text.toLowerCase().includes('chart')) {
      return text + '\n\nPlease format the comparison as a clear table with relevant criteria.';
    }
    return text;
  }

  private addFormatInstructions(text: string, analysis: PromptAnalysis): string {
    const formats = analysis.contextGaps.missingFormat;
    if (formats.length === 0) return text;
    
    const formatMap = {
      'table': 'Please format the response as a table with clear headers.',
      'list': 'Please format the response as a numbered or bulleted list.',
      'step_by_step': 'Please provide step-by-step instructions.',
      'code_block': 'Please include code examples with proper formatting.',
      'comparison_chart': 'Please provide a comparison chart.',
      'example_based': 'Please include practical examples.'
    };
    
    const instruction = formatMap[formats[0] as keyof typeof formatMap];
    return instruction ? `${text}\n\n${instruction}` : text;
  }

  private validateEnhancement(
    original: string, 
    enhanced: { text: string; changes: Enhancement[]; confidence: number },
    analysis: PromptAnalysis
  ): { text: string; changes: Enhancement[]; confidence: number } {
    // Validation rules
    if (enhanced.text.length > this.config.thresholds.maxEnhancementLength) {
      console.warn('Enhancement too long, truncating');
      return {
        text: enhanced.text.substring(0, this.config.thresholds.maxEnhancementLength) + '...',
        changes: enhanced.changes,
        confidence: enhanced.confidence * 0.8 // Reduce confidence for truncation
      };
    }

    // Ensure minimum improvement
    if (enhanced.text === original) {
      return {
        text: original,
        changes: [],
        confidence: 1.0
      };
    }

    // Quality check: ensure enhancement makes sense
    const improvementRatio = enhanced.text.length / original.length;
    if (improvementRatio > 3.0) {
      console.warn('Enhancement too verbose, applying conservative enhancement');
      return {
        text: this.applyConservativeEnhancement(original, analysis),
        changes: [{
          type: 'CLARIFICATION' as any,
          description: 'Applied conservative enhancement',
          section: 'conservative',
          rationale: 'Full enhancement was too verbose'
        }],
        confidence: 0.6
      };
    }

    return enhanced;
  }

  private applyConservativeEnhancement(original: string, analysis: PromptAnalysis): string {
    // Apply minimal, safe enhancements
    let enhanced = original;
    
    if (analysis.vaguenessLevel === VaguenessLevel.HIGH && original.length < 30) {
      enhanced = `Please provide detailed information about: ${original}`;
    }
    
    if (analysis.contextGaps.missingFormat.length > 0) {
      const format = analysis.contextGaps.missingFormat[0];
      if (format === 'list') {
        enhanced += '\n\nPlease format the response as a clear list.';
      } else if (format === 'table') {
        enhanced += '\n\nPlease format the response as a table.';
      }
    }
    
    return enhanced;
  }

  private createFallbackResult(input: string, startTime: number, reason: string): EnhancedPrompt {
    return {
      original: input,
      enhanced: input,
      changes: [],
      confidence: 0.0,
      processingTime: Date.now() - startTime
    };
  }

  // Public utility methods
  updateConfig(newConfig: Partial<EnhancementConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Reinitialize components with new config
    this.enhancementAI = new EnhancementAI(this.config.enhancementModel);
    this.templateEngine = new TemplateEngine(this.config);
  }

  getConfig(): EnhancementConfig {
    return { ...this.config };
  }

  async testEnhancement(input: string): Promise<{ analysis: PromptAnalysis; result: EnhancedPrompt }> {
    const analysis = await this.analyze(input);
    const result = await this.process(input);
    return { analysis, result };
  }
}

// Factory function for easy instantiation
export function createPromptEnhancer(config?: Partial<EnhancementConfig>): PromptEnhancer {
  return new PromptEnhancer(config);
}

// Utility function for quick enhancement
export async function enhancePrompt(
  input: string, 
  context?: EnhancementContext,
  config?: Partial<EnhancementConfig>
): Promise<EnhancedPrompt> {
  const enhancer = createPromptEnhancer(config);
  return enhancer.process(input, context);
}