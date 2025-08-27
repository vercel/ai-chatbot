import {
  PromptAnalysis,
  EnhancementContext,
  IntentCategory,
  VaguenessLevel,
  ComplexityLevel
} from '@/lib/types';
import { 
  EnhancementTemplate, 
  EnhancementRule,
  EnhancementConfig 
} from './enhancement-config';

export interface TemplateApplication {
  template: EnhancementTemplate;
  result: string;
  confidence: number;
}

export interface RuleApplication {
  rule: EnhancementRule;
  result: string;
  applied: boolean;
}

export class TemplateEngine {
  private templates: EnhancementTemplate[];
  private rules: EnhancementRule[];

  constructor(config: EnhancementConfig) {
    this.templates = config.templates;
    this.rules = config.customRules;
  }

  findMatchingTemplates(analysis: PromptAnalysis, input: string): EnhancementTemplate[] {
    const matches: Array<{ template: EnhancementTemplate; score: number }> = [];

    for (const template of this.templates) {
      let score = 0;

      // Check intent category match
      if (template.intentCategories.includes(analysis.intent.category)) {
        score += 3;
      }

      // Check pattern match
      if (template.pattern.test(input)) {
        score += 2;
      }

      // Bonus for high-priority templates
      score += (4 - template.priority);

      if (score > 0) {
        matches.push({ template, score });
      }
    }

    // Sort by score (highest first) and return templates
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Limit to top 3 matches
      .map(match => match.template);
  }

  applyTemplate(
    template: EnhancementTemplate, 
    input: string, 
    analysis: PromptAnalysis,
    context?: EnhancementContext
  ): TemplateApplication {
    try {
      const enhancedText = template.apply(input, { analysis, context });
      const confidence = this.calculateTemplateConfidence(template, input, analysis);

      return {
        template,
        result: enhancedText,
        confidence
      };
    } catch (error) {
      console.error(`Template application failed for ${template.id}:`, error);
      return {
        template,
        result: input,
        confidence: 0
      };
    }
  }

  combineTemplates(
    applications: TemplateApplication[], 
    input: string
  ): string {
    if (applications.length === 0) {
      return input;
    }

    // Use the highest confidence template as base
    const bestApplication = applications.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    let result = bestApplication.result;

    // Apply additional enhancements from other templates if they add value
    for (const application of applications) {
      if (application.template.id !== bestApplication.template.id) {
        result = this.mergeTemplateResults(result, application.result, application.confidence);
      }
    }

    return result;
  }

  evaluateRules(analysis: PromptAnalysis, input: string): EnhancementRule[] {
    return this.rules
      .filter(rule => rule.condition(analysis))
      .sort((a, b) => a.priority - b.priority); // Lower priority number = higher precedence
  }

  applyRules(
    rules: EnhancementRule[], 
    input: string, 
    analysis: PromptAnalysis
  ): RuleApplication[] {
    const applications: RuleApplication[] = [];
    let currentText = input;

    for (const rule of rules) {
      try {
        const enhanced = rule.action(currentText, analysis);
        const applied = enhanced !== currentText;

        applications.push({
          rule,
          result: enhanced,
          applied
        });

        if (applied) {
          currentText = enhanced;
        }
      } catch (error) {
        console.error(`Rule application failed for ${rule.id}:`, error);
        applications.push({
          rule,
          result: currentText,
          applied: false
        });
      }
    }

    return applications;
  }

  processWithTemplatesAndRules(
    input: string,
    analysis: PromptAnalysis,
    context?: EnhancementContext
  ): string {
    // Step 1: Apply templates
    const matchingTemplates = this.findMatchingTemplates(analysis, input);
    const templateApplications = matchingTemplates.map(template =>
      this.applyTemplate(template, input, analysis, context)
    );

    let enhancedText = templateApplications.length > 0
      ? this.combineTemplates(templateApplications, input)
      : input;

    // Step 2: Apply rules
    const applicableRules = this.evaluateRules(analysis, enhancedText);
    const ruleApplications = this.applyRules(applicableRules, enhancedText, analysis);

    // Get final result from rule applications
    const finalRuleApplication = ruleApplications[ruleApplications.length - 1];
    if (finalRuleApplication) {
      enhancedText = finalRuleApplication.result;
    }

    return enhancedText;
  }

  // Template utility methods
  static expandTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\\\$&'), 'g'), value);
    }
    
    return result;
  }

  static extractVariables(template: string): string[] {
    const matches = template.match(/{([^}]+)}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  // Context-aware template application
  applyContextualTemplate(
    template: EnhancementTemplate,
    input: string,
    analysis: PromptAnalysis,
    context?: EnhancementContext
  ): string {
    const variables: Record<string, string> = {
      originalPrompt: input,
      subject: analysis.intent.subject,
      action: analysis.intent.action,
      intentCategory: analysis.intent.category
    };

    // Add context-specific variables
    if (context?.selectedModel) {
      variables.selectedModel = context.selectedModel;
    }

    if (context?.chatHistory && context.chatHistory.length > 0) {
      variables.hasHistory = 'true';
      const lastMessage = context.chatHistory[context.chatHistory.length - 1];
      variables.lastMessage = lastMessage?.parts
        ?.filter((part: any) => part.type === 'text')
        ?.map((part: any) => part.text)
        ?.join('') || '';
    }

    // Add analysis-specific variables
    variables.vaguenessLevel = analysis.vaguenessLevel;
    variables.complexity = analysis.complexity;
    variables.missingDetails = analysis.contextGaps.missingDetails.join(', ');
    variables.missingFormat = analysis.contextGaps.missingFormat.join(', ');
    variables.keywords = analysis.keywords.join(', ');

    return TemplateEngine.expandTemplate(template.template, variables);
  }

  private calculateTemplateConfidence(
    template: EnhancementTemplate,
    input: string,
    analysis: PromptAnalysis
  ): number {
    let confidence = 0.6; // Base confidence

    // Intent category match
    if (template.intentCategories.includes(analysis.intent.category)) {
      confidence += 0.2;
    }

    // Pattern match strength
    if (template.pattern.test(input)) {
      confidence += 0.15;
    }

    // Template priority (higher priority = higher confidence)
    confidence += (4 - template.priority) * 0.05;

    // Adjust based on analysis quality
    confidence += analysis.intent.confidence * 0.1;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private mergeTemplateResults(base: string, additional: string, additionalConfidence: number): string {
    // Simple merge strategy: only add if additional has high confidence and adds significant value
    if (additionalConfidence > 0.7 && additional.length > base.length * 1.2) {
      // Extract unique enhancements from additional
      const baseWords = new Set(base.toLowerCase().split(/\\s+/));
      const additionalWords = additional.toLowerCase().split(/\\s+/);
      const uniqueWords = additionalWords.filter(word => !baseWords.has(word));
      
      if (uniqueWords.length > 3) {
        // Add significant new content
        return `${base}\\n\\nAdditional considerations: ${uniqueWords.slice(0, 10).join(' ')}`;
      }
    }
    
    return base;
  }

  // Specialized template applications
  applyCodeGenerationTemplate(input: string, analysis: PromptAnalysis): string {
    const codeTemplate = this.templates.find(t => t.id === 'code_request_enhancement');
    if (!codeTemplate) return input;

    const variables = {
      originalPrompt: input,
      codeType: this.extractCodeType(input),
      enhancedRequirements: this.enhanceCodeRequirements(input, analysis)
    };

    return TemplateEngine.expandTemplate(codeTemplate.template, variables);
  }

  applyComparisonTemplate(input: string, analysis: PromptAnalysis): string {
    const comparisonTemplate = this.templates.find(t => t.id === 'comparison_request');
    if (!comparisonTemplate) return input;

    return TemplateEngine.expandTemplate(comparisonTemplate.template, {
      originalPrompt: input
    });
  }

  applyExplanationTemplate(input: string, analysis: PromptAnalysis): string {
    const explanationTemplate = this.templates.find(t => t.id === 'explanation_request');
    if (!explanationTemplate) return input;

    const variables = {
      originalPrompt: input,
      topic: analysis.intent.subject || this.extractTopic(input)
    };

    return TemplateEngine.expandTemplate(explanationTemplate.template, variables);
  }

  private extractCodeType(input: string): string {
    const codeTypes = ['function', 'script', 'program', 'app', 'component', 'module', 'class'];
    const found = codeTypes.find(type => input.toLowerCase().includes(type));
    return found || 'code';
  }

  private enhanceCodeRequirements(input: string, analysis: PromptAnalysis): string {
    let requirements = input;
    
    if (!input.toLowerCase().includes('language')) {
      requirements += '\\n- Specify the programming language and any frameworks';
    }
    
    if (!input.toLowerCase().includes('error')) {
      requirements += '\\n- Include proper error handling';
    }
    
    if (!input.toLowerCase().includes('comment')) {
      requirements += '\\n- Add clear comments explaining the code';
    }
    
    return requirements;
  }

  private extractTopic(input: string): string {
    // Extract the main topic from the input
    const words = input.toLowerCase()
      .replace(/^(explain|describe|tell me about|what is)\\s+/, '')
      .split(/\\s+/)
      .slice(0, 3);
    
    return words.join(' ') || 'this topic';
  }
}