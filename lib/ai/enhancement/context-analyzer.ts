import {
  Sentiment,
  ContextGaps,
  VaguenessLevel,
  ComplexityLevel,
  EmotionType,
  FormatType,
  EnhancementContext
} from '@/lib/types';

export class ContextAnalyzer {
  
  analyzeSentiment(input: string): Sentiment {
    const normalizedInput = input.toLowerCase().trim();
    
    const positiveWords = ['please', 'thank', 'awesome', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful'];
    const negativeWords = ['urgent', 'problem', 'issue', 'error', 'broken', 'fail', 'wrong', 'bad', 'terrible', 'hate'];
    const frustrationWords = ["why won't", "doesn't work", 'not working', 'frustrated', 'annoying', 'stupid'];
    const excitementWords = ['exciting', "can't wait", 'awesome', 'amazing', 'love this', 'incredible'];
    const confusionWords = ['confused', "don't understand", 'unclear', 'what does this mean', 'how does this work'];
    const urgentWords = ['urgent', 'asap', 'quickly', 'immediately', 'deadline', 'rush', 'emergency'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    let emotionType: EmotionType | undefined;
    
    // Count sentiment indicators
    positiveWords.forEach(word => {
      if (normalizedInput.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (normalizedInput.includes(word)) negativeScore++;
    });
    
    // Detect specific emotions
    if (frustrationWords.some(word => normalizedInput.includes(word))) {
      emotionType = EmotionType.FRUSTRATED;
      negativeScore += 2;
    } else if (excitementWords.some(word => normalizedInput.includes(word))) {
      emotionType = EmotionType.EXCITED;
      positiveScore += 2;
    } else if (confusionWords.some(word => normalizedInput.includes(word))) {
      emotionType = EmotionType.CONFUSED;
    } else if (urgentWords.some(word => normalizedInput.includes(word))) {
      emotionType = EmotionType.URGENT;
    } else if (this.isCasualTone(normalizedInput)) {
      emotionType = EmotionType.CASUAL;
    }
    
    // Determine polarity and intensity
    let polarity: 'positive' | 'negative' | 'neutral' = 'neutral';
    let intensity = 0;
    
    if (positiveScore > negativeScore) {
      polarity = 'positive';
      intensity = Math.min(positiveScore / 3, 1);
    } else if (negativeScore > positiveScore) {
      polarity = 'negative';
      intensity = Math.min(negativeScore / 3, 1);
    } else {
      intensity = 0.1;
    }
    
    return {
      polarity,
      intensity,
      emotion: emotionType
    };
  }

  detectVagueness(input: string): VaguenessLevel {
    const normalizedInput = input.toLowerCase().trim();
    let vaguenessScore = 0;
    
    // Check for vague indicators
    const vagueIndicators = [
      /^(what|how|why)\s*\?*$/i,  // Single word questions
      /\b(something|anything|somewhere|somehow)\b/i,
      /\b(stuff|things|whatever)\b/i,
      /\b(kind of|sort of|maybe|perhaps)\b/i,
      /\b(general|basic|simple)\b.*\b(information|overview)\b/i
    ];
    
    vagueIndicators.forEach(indicator => {
      if (indicator.test(normalizedInput)) vaguenessScore++;
    });
    
    // Check length - very short prompts are often vague
    if (input.length < 20) vaguenessScore += 2;
    else if (input.length < 40) vaguenessScore += 1;
    
    // Check for specific details
    const specificIndicators = [
      /\b\d+/,  // Numbers
      /\b(step|first|second|then|next|finally)\b/i,  // Sequential words
      /\b(because|since|due to|reason)\b/i,  // Causal words
      /\b(exactly|specifically|precisely)\b/i,  // Precision words
      /\b[A-Z][a-z]+\s[A-Z][a-z]+/  // Proper nouns (names, places)
    ];
    
    specificIndicators.forEach(indicator => {
      if (indicator.test(input)) vaguenessScore--;
    });
    
    // Determine vagueness level
    if (vaguenessScore >= 3) return VaguenessLevel.HIGH;
    if (vaguenessScore >= 1) return VaguenessLevel.MEDIUM;
    return VaguenessLevel.LOW;
  }

  identifyMissingContext(input: string, context?: EnhancementContext): ContextGaps {
    const normalizedInput = input.toLowerCase().trim();
    const missingFormat: FormatType[] = [];
    const missingDetails: string[] = [];
    const ambiguousTerms: string[] = [];
    const implicitRequirements: string[] = [];
    
    // Identify missing format specifications
    if (this.shouldHaveTable(normalizedInput)) {
      missingFormat.push(FormatType.TABLE);
    }
    
    if (this.shouldHaveList(normalizedInput)) {
      missingFormat.push(FormatType.LIST);
    }
    
    if (this.shouldHaveSteps(normalizedInput)) {
      missingFormat.push(FormatType.STEP_BY_STEP);
    }
    
    if (this.shouldHaveCodeBlock(normalizedInput)) {
      missingFormat.push(FormatType.CODE_BLOCK);
    }
    
    if (this.shouldHaveComparison(normalizedInput)) {
      missingFormat.push(FormatType.COMPARISON_CHART);
    }
    
    if (this.shouldHaveExamples(normalizedInput)) {
      missingFormat.push(FormatType.EXAMPLE_BASED);
    }
    
    // Identify missing details
    if (this.isCodeRequest(normalizedInput)) {
      if (!this.hasLanguageSpecification(normalizedInput)) {
        missingDetails.push('programming language');
      }
      if (!this.hasRequirements(normalizedInput)) {
        missingDetails.push('specific requirements');
      }
      if (!this.hasUseCase(normalizedInput)) {
        missingDetails.push('use case or context');
      }
    }
    
    if (this.isComparisonRequest(normalizedInput)) {
      if (!this.hasCriteria(normalizedInput)) {
        missingDetails.push('comparison criteria');
      }
      if (!this.hasContext(normalizedInput)) {
        missingDetails.push('context or use case');
      }
    }
    
    if (this.isExplanationRequest(normalizedInput)) {
      if (!this.hasAudience(normalizedInput)) {
        missingDetails.push('target audience level');
      }
      if (!this.hasScope(normalizedInput)) {
        missingDetails.push('scope or depth of explanation');
      }
    }
    
    // Identify ambiguous terms
    const potentiallyAmbiguous = this.findAmbiguousTerms(normalizedInput);
    ambiguousTerms.push(...potentiallyAmbiguous);
    
    // Identify implicit requirements
    if (this.hasImplicitFormatting(normalizedInput)) {
      implicitRequirements.push('structured formatting');
    }
    
    if (this.hasImplicitExamples(normalizedInput)) {
      implicitRequirements.push('practical examples');
    }
    
    if (this.hasImplicitConstraints(normalizedInput)) {
      implicitRequirements.push('constraints or limitations');
    }
    
    return {
      missingFormat,
      missingDetails,
      ambiguousTerms,
      implicitRequirements
    };
  }

  assessComplexity(input: string): ComplexityLevel {
    const normalizedInput = input.toLowerCase().trim();
    let complexityScore = 0;
    
    // Length indicators
    if (input.length > 200) complexityScore += 2;
    else if (input.length > 100) complexityScore += 1;
    
    // Technical terms
    const technicalTerms = [
      'algorithm', 'database', 'architecture', 'framework', 'protocol',
      'optimization', 'integration', 'deployment', 'authentication', 'encryption'
    ];
    technicalTerms.forEach(term => {
      if (normalizedInput.includes(term)) complexityScore++;
    });
    
    // Multiple requirements
    const requirementIndicators = ['and', 'also', 'additionally', 'furthermore', 'moreover'];
    requirementIndicators.forEach(indicator => {
      if (normalizedInput.includes(indicator)) complexityScore++;
    });
    
    // Conditional logic
    const conditionalIndicators = ['if', 'when', 'unless', 'provided that', 'in case'];
    conditionalIndicators.forEach(indicator => {
      if (normalizedInput.includes(indicator)) complexityScore++;
    });
    
    if (complexityScore >= 5) return ComplexityLevel.COMPLEX;
    if (complexityScore >= 2) return ComplexityLevel.MODERATE;
    return ComplexityLevel.SIMPLE;
  }

  private isCasualTone(input: string): boolean {
    const casualIndicators = [
      'hey', 'hi', 'hello', 'sup', 'yo',
      'kinda', 'sorta', 'gonna', 'wanna',
      'cool', 'awesome', 'neat', 'sweet'
    ];
    return casualIndicators.some(indicator => input.includes(indicator));
  }

  private shouldHaveTable(input: string): boolean {
    const tableIndicators = [
      /\b(compare|comparison|versus|vs)\b/i,
      /\b(features|specifications|options)\b/i,
      /\b(pros and cons|advantages|disadvantages)\b/i,
      /\b(different|various|multiple)\b.*\b(options|choices|alternatives)\b/i
    ];
    return tableIndicators.some(indicator => indicator.test(input));
  }

  private shouldHaveList(input: string): boolean {
    const listIndicators = [
      /\b(list|steps|items|points)\b/i,
      /\b(benefits|features|requirements|tools)\b/i,
      /\b(top|best|main|key)\b.*\b(\d+|few|several)\b/i
    ];
    return listIndicators.some(indicator => indicator.test(input));
  }

  private shouldHaveSteps(input: string): boolean {
    const stepIndicators = [
      /\b(how to|tutorial|guide|walkthrough)\b/i,
      /\b(steps|process|procedure|method)\b/i,
      /\b(setup|install|configure|implement)\b/i
    ];
    return stepIndicators.some(indicator => indicator.test(input));
  }

  private shouldHaveCodeBlock(input: string): boolean {
    const codeIndicators = [
      /\b(code|script|function|program|implementation)\b/i,
      /\b(write|create|generate|build)\b.*\b(code|script|function)\b/i,
      /\b(html|css|javascript|python|java|react|vue|angular)\b/i
    ];
    return codeIndicators.some(indicator => indicator.test(input));
  }

  private shouldHaveComparison(input: string): boolean {
    const comparisonIndicators = [
      /\b(compare|versus|vs|difference)\b/i,
      /\b(better|worse|pros and cons)\b/i,
      /\b(which is|what's the difference)\b/i
    ];
    return comparisonIndicators.some(indicator => indicator.test(input));
  }

  private shouldHaveExamples(input: string): boolean {
    const exampleIndicators = [
      /\b(example|sample|demo|illustration)\b/i,
      /\b(show me|demonstrate|illustrate)\b/i,
      /\b(practical|real-world|concrete)\b/i
    ];
    return exampleIndicators.some(indicator => indicator.test(input));
  }

  private isCodeRequest(input: string): boolean {
    return /\b(write|create|generate|build|code|script|function|program)\b/i.test(input);
  }

  private isComparisonRequest(input: string): boolean {
    return /\b(compare|versus|vs|difference|better)\b/i.test(input);
  }

  private isExplanationRequest(input: string): boolean {
    return /\b(explain|describe|what is|tell me about)\b/i.test(input);
  }

  private hasLanguageSpecification(input: string): boolean {
    const languages = ['javascript', 'python', 'java', 'html', 'css', 'react', 'vue', 'angular', 'node'];
    return languages.some(lang => input.toLowerCase().includes(lang));
  }

  private hasRequirements(input: string): boolean {
    const requirementIndicators = ['should', 'must', 'need', 'require', 'with', 'that'];
    return requirementIndicators.some(indicator => input.toLowerCase().includes(indicator));
  }

  private hasUseCase(input: string): boolean {
    const useCaseIndicators = ['for', 'to', 'because', 'since', 'in order to'];
    return useCaseIndicators.some(indicator => input.toLowerCase().includes(indicator));
  }

  private hasCriteria(input: string): boolean {
    const criteriaIndicators = ['based on', 'criteria', 'factors', 'considerations'];
    return criteriaIndicators.some(indicator => input.toLowerCase().includes(indicator));
  }

  private hasContext(input: string): boolean {
    const contextIndicators = ['for', 'in', 'when', 'while', 'during', 'context'];
    return contextIndicators.some(indicator => input.toLowerCase().includes(indicator));
  }

  private hasAudience(input: string): boolean {
    const audienceIndicators = ['beginner', 'advanced', 'expert', 'simple', 'detailed', 'technical'];
    return audienceIndicators.some(indicator => input.toLowerCase().includes(indicator));
  }

  private hasScope(input: string): boolean {
    const scopeIndicators = ['overview', 'detailed', 'brief', 'comprehensive', 'in-depth', 'basic'];
    return scopeIndicators.some(indicator => input.toLowerCase().includes(indicator));
  }

  private findAmbiguousTerms(input: string): string[] {
    const ambiguousPatterns = [
      /\b(it|this|that|these|those)\b/gi,
      /\b(thing|stuff|something)\b/gi,
      /\b(good|bad|better|best)\b/gi,
      /\b(big|small|fast|slow)\b/gi
    ];
    
    const found: string[] = [];
    ambiguousPatterns.forEach(pattern => {
      const matches = input.match(pattern);
      if (matches) {
        found.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    return [...new Set(found)]; // Remove duplicates
  }

  private hasImplicitFormatting(input: string): boolean {
    const formattingClues = ['organize', 'structure', 'clear', 'easy to understand'];
    return formattingClues.some(clue => input.toLowerCase().includes(clue));
  }

  private hasImplicitExamples(input: string): boolean {
    const exampleClues = ['practical', 'real-world', 'concrete', 'show me how'];
    return exampleClues.some(clue => input.toLowerCase().includes(clue));
  }

  private hasImplicitConstraints(input: string): boolean {
    const constraintClues = ['limitations', 'considerations', 'caveats', 'important'];
    return constraintClues.some(clue => input.toLowerCase().includes(clue));
  }
}