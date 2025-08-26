import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { 
  PromptAnalysis, 
  EnhancementContext, 
  Enhancement, 
  EnhancementType,
  Intent,
  ContextGaps 
} from '@/lib/types';

export interface EnhancementResult {
  text: string;
  changes: Enhancement[];
  confidence: number;
}

export class EnhancementAI {
  private modelId: string;
  private maxTokens: number;
  private temperature: number;
  private systemPrompt: string;

  constructor(config: {
    modelId: string;
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
  }) {
    this.modelId = config.modelId;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
    this.systemPrompt = config.systemPrompt;
  }

  async reformulate(
    prompt: string, 
    analysis: PromptAnalysis, 
    context?: EnhancementContext
  ): Promise<EnhancementResult> {
    try {
      const enhancementPrompt = this.buildEnhancementPrompt(prompt, analysis, context);
      
      const result = await generateText({
        model: myProvider.languageModel(this.modelId),
        system: this.systemPrompt,
        prompt: enhancementPrompt,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
      });

      const enhancedText = result.text.trim();
      const changes = this.identifyChanges(prompt, enhancedText, analysis);
      const confidence = this.calculateConfidence(prompt, enhancedText, analysis);

      return {
        text: enhancedText,
        changes,
        confidence
      };
    } catch (error) {
      console.error('Enhancement AI failed:', error);
      // Return original prompt as fallback
      return {
        text: prompt,
        changes: [],
        confidence: 0
      };
    }
  }

  async addContext(
    prompt: string, 
    gaps: ContextGaps, 
    context?: EnhancementContext
  ): Promise<string> {
    const contextPrompt = this.buildContextPrompt(prompt, gaps, context);
    
    try {
      const result = await generateText({
        model: myProvider.languageModel(this.modelId),
        system: this.getContextSystemPrompt(),
        prompt: contextPrompt,
        maxTokens: this.maxTokens,
        temperature: 0.2, // Lower temperature for context addition
      });

      return result.text.trim();
    } catch (error) {
      console.error('Context addition failed:', error);
      return prompt;
    }
  }

  async suggestFormat(prompt: string, intent: Intent): Promise<string> {
    const formatPrompt = this.buildFormatPrompt(prompt, intent);
    
    try {
      const result = await generateText({
        model: myProvider.languageModel(this.modelId),
        system: this.getFormatSystemPrompt(),
        prompt: formatPrompt,
        maxTokens: 200,
        temperature: 0.1, // Very low temperature for format suggestions
      });

      return result.text.trim();
    } catch (error) {
      console.error('Format suggestion failed:', error);
      return '';
    }
  }

  private buildEnhancementPrompt(
    prompt: string, 
    analysis: PromptAnalysis, 
    context?: EnhancementContext
  ): string {
    let enhancementPrompt = `Original prompt: "${prompt}"\\n\\n`;
    
    enhancementPrompt += `Analysis Summary:\\n`;
    enhancementPrompt += `- Intent: ${analysis.intent.category} (${analysis.intent.action})\\n`;
    enhancementPrompt += `- Vagueness Level: ${analysis.vaguenessLevel}\\n`;
    enhancementPrompt += `- Complexity: ${analysis.complexity}\\n`;
    enhancementPrompt += `- Type: ${analysis.promptType}\\n`;
    
    if (analysis.contextGaps.missingDetails.length > 0) {
      enhancementPrompt += `- Missing Details: ${analysis.contextGaps.missingDetails.join(', ')}\\n`;
    }
    
    if (analysis.contextGaps.missingFormat.length > 0) {
      enhancementPrompt += `- Suggested Formats: ${analysis.contextGaps.missingFormat.join(', ')}\\n`;
    }
    
    if (analysis.contextGaps.ambiguousTerms.length > 0) {
      enhancementPrompt += `- Ambiguous Terms: ${analysis.contextGaps.ambiguousTerms.join(', ')}\\n`;
    }
    
    enhancementPrompt += `\\nPlease enhance this prompt to be more specific, actionable, and likely to produce a high-quality response. `;
    enhancementPrompt += `Focus on clarifying the intent, adding missing context, and suggesting appropriate output format.\\n\\n`;
    enhancementPrompt += `Enhanced prompt:`;
    
    return enhancementPrompt;
  }

  private buildContextPrompt(
    prompt: string, 
    gaps: ContextGaps, 
    context?: EnhancementContext
  ): string {
    let contextPrompt = `Original prompt: "${prompt}"\\n\\n`;
    
    contextPrompt += `Missing context to add:\\n`;
    
    if (gaps.missingDetails.length > 0) {
      contextPrompt += `- Details: ${gaps.missingDetails.join(', ')}\\n`;
    }
    
    if (gaps.implicitRequirements.length > 0) {
      contextPrompt += `- Implicit requirements: ${gaps.implicitRequirements.join(', ')}\\n`;
    }
    
    if (context?.chatHistory && context.chatHistory.length > 0) {
      contextPrompt += `\\nRecent conversation context available.\\n`;
    }
    
    contextPrompt += `\\nAdd the missing context to make this prompt more complete and actionable:\\n\\n`;
    contextPrompt += `Enhanced prompt:`;
    
    return contextPrompt;
  }

  private buildFormatPrompt(prompt: string, intent: Intent): string {
    return `Prompt: "${prompt}"\\n\\nIntent: ${intent.category}\\n\\nSuggest appropriate output format instructions that would improve the usefulness of the response. Be concise and specific.\\n\\nFormat suggestion:`;
  }

  private getContextSystemPrompt(): string {
    return `You are an expert at adding helpful context to user prompts. Your role is to identify missing information and context that would improve the quality of AI responses.

Guidelines:
- Add only relevant context that directly improves the prompt
- Don't change the user's original intent or tone
- Be concise and focused
- Provide context that helps the AI give better, more complete answers
- Don't add unnecessary complexity

Return only the enhanced prompt with added context.`;
  }

  private getFormatSystemPrompt(): string {
    return `You are an expert at suggesting output formats that improve the usefulness of AI responses.

Guidelines:
- Suggest formats that match the user's intent (tables, lists, step-by-step, etc.)
- Be specific about the format structure
- Focus on formats that make information easier to consume
- Keep suggestions concise and actionable
- Only suggest formats that would genuinely improve the response

Return only the format instruction to be added to the prompt.`;
  }

  private identifyChanges(
    original: string, 
    enhanced: string, 
    analysis: PromptAnalysis
  ): Enhancement[] {
    const changes: Enhancement[] = [];
    
    // Simple heuristic to identify types of changes
    if (enhanced.length > original.length * 1.3) {
      changes.push({
        type: EnhancementType.DETAIL_EXPANSION,
        description: 'Added detailed context and specifications',
        section: 'content',
        rationale: 'Original prompt was too brief and lacked specificity'
      });
    }
    
    if (enhanced.toLowerCase().includes('format') || 
        enhanced.toLowerCase().includes('structure') ||
        enhanced.toLowerCase().includes('table') ||
        enhanced.toLowerCase().includes('list')) {
      changes.push({
        type: EnhancementType.FORMAT_SPECIFICATION,
        description: 'Added output format instructions',
        section: 'format',
        rationale: 'Structured output will improve response usefulness'
      });
    }
    
    if (analysis.contextGaps.missingDetails.length > 0) {
      changes.push({
        type: EnhancementType.CONTEXT_ADDITION,
        description: `Added context for: ${analysis.contextGaps.missingDetails.join(', ')}`,
        section: 'context',
        rationale: 'Original prompt lacked necessary contextual information'
      });
    }
    
    if (analysis.contextGaps.ambiguousTerms.length > 0) {
      changes.push({
        type: EnhancementType.CLARIFICATION,
        description: `Clarified ambiguous terms: ${analysis.contextGaps.ambiguousTerms.join(', ')}`,
        section: 'clarity',
        rationale: 'Ambiguous terms could lead to misinterpretation'
      });
    }
    
    if (enhanced.includes('\\n') && !original.includes('\\n')) {
      changes.push({
        type: EnhancementType.STRUCTURE_IMPROVEMENT,
        description: 'Improved prompt structure and organization',
        section: 'structure',
        rationale: 'Better structure makes the request clearer'
      });
    }
    
    return changes;
  }

  private calculateConfidence(
    original: string, 
    enhanced: string, 
    analysis: PromptAnalysis
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on analysis quality
    if (analysis.intent.confidence > 0.8) {
      confidence += 0.2;
    }
    
    // Increase confidence if significant improvements were made
    if (enhanced.length > original.length * 1.2) {
      confidence += 0.1;
    }
    
    // Increase confidence if context gaps were addressed
    if (analysis.contextGaps.missingDetails.length > 0 || 
        analysis.contextGaps.missingFormat.length > 0) {
      confidence += 0.15;
    }
    
    // Decrease confidence if the enhanced version is too similar
    if (enhanced.length < original.length * 1.1) {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
}

// System prompts for different enhancement types
export const enhancementSystemPrompts = {
  general: `You are a prompt enhancement specialist. Your role is to improve user prompts to maximize the quality and relevance of AI responses.

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

Return only the enhanced prompt without explanations or meta-commentary.`,

  codeGeneration: `You are a specialist in enhancing code generation prompts. Your role is to make coding requests more specific and actionable.

Focus on:
1. Clarifying the programming language and framework
2. Specifying requirements and constraints
3. Adding context about the intended use case
4. Requesting appropriate code structure and documentation
5. Including example usage requirements

Guidelines:
- Ensure technical specifications are clear
- Add requirements for code quality (comments, error handling, etc.)
- Specify desired output format (complete code, snippets, explanations)
- Include context about the development environment when relevant

Return only the enhanced prompt.`,

  analysis: `You are a specialist in enhancing analysis and explanation prompts. Your role is to make requests for analysis more comprehensive and structured.

Focus on:
1. Clarifying the scope and depth of analysis needed
2. Specifying the target audience level
3. Adding context about why the analysis is needed
4. Requesting structured output with clear sections
5. Including requests for examples and practical applications

Guidelines:
- Ensure the analysis scope is well-defined
- Request appropriate level of detail for the audience
- Ask for structured, easy-to-follow explanations
- Include requests for relevant examples when helpful

Return only the enhanced prompt.`
};