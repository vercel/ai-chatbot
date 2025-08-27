import {
  Intent,
  IntentCategory,
  PromptType,
  ComplexityLevel
} from '@/lib/types';

export interface IntentPattern {
  category: IntentCategory;
  patterns: RegExp[];
  keywords: string[];
  priority: number;
}

export class IntentDetector {
  private intentPatterns: IntentPattern[] = [
    {
      category: IntentCategory.CODE_GENERATION,
      patterns: [
        /\b(write|create|generate|build|code|script|function|program|app|component)\b.*\b(code|script|function|program|app|component|html|css|javascript|python|java|react|vue|angular)\b/i,
        /\b(implement|develop|build)\b.*\b(feature|functionality|module)\b/i,
        /\bcan you (write|create|generate|build)\b/i
      ],
      keywords: ['write', 'create', 'generate', 'build', 'code', 'script', 'function', 'program', 'implement', 'develop'],
      priority: 1
    },
    
    {
      category: IntentCategory.INFORMATION_REQUEST,
      patterns: [
        /^(what|who|when|where|which)\\b/i,
        /\\b(tell me|explain|describe|define)\\b/i,
        /\\b(information|details|facts)\\b.*\\babout\\b/i
      ],
      keywords: ['what', 'who', 'when', 'where', 'which', 'tell', 'explain', 'describe', 'define', 'information'],
      priority: 2
    },
    
    {
      category: IntentCategory.TASK_EXECUTION,
      patterns: [
        /^(how\s+to|how\s+do\s+i|how\s+can\s+i)\b/i,
        /\b(steps|tutorial|guide|walkthrough)\b/i,
        /\b(help me|assist me|show me)\b.*\b(do|accomplish|achieve)\b/i
      ],
      keywords: ['how', 'steps', 'tutorial', 'guide', 'walkthrough', 'help', 'assist', 'show'],
      priority: 1
    },
    
    {
      category: IntentCategory.COMPARISON,
      patterns: [
        /\b(compare|versus|vs|difference|better|worse)\b/i,
        /\b(pros and cons|advantages|disadvantages)\b/i,
        /\b(which is better|what's the difference)\b/i
      ],
      keywords: ['compare', 'versus', 'vs', 'difference', 'better', 'worse', 'pros', 'cons', 'advantages', 'disadvantages'],
      priority: 2
    },
    
    {
      category: IntentCategory.ANALYSIS,
      patterns: [
        /\b(analyze|examine|evaluate|assess|review)\b/i,
        /\b(analysis|evaluation|assessment|breakdown)\b/i,
        /\b(why does|what causes|what leads to)\b/i
      ],
      keywords: ['analyze', 'examine', 'evaluate', 'assess', 'review', 'analysis', 'evaluation', 'assessment'],
      priority: 2
    },
    
    {
      category: IntentCategory.CREATIVE_WRITING,
      patterns: [
        /\b(write|compose|create)\b.*\b(story|poem|essay|article|content|copy)\b/i,
        /\b(creative|imaginative|fictional)\b/i,
        /\b(brainstorm|ideate|come up with)\b.*\b(ideas|concepts)\b/i
      ],
      keywords: ['write', 'compose', 'create', 'story', 'poem', 'essay', 'article', 'creative', 'brainstorm'],
      priority: 2
    },
    
    {
      category: IntentCategory.EXPLANATION,
      patterns: [
        /^(explain|describe|clarify)\b/i,
        /\b(what does.*mean|what is)\b/i,
        /\b(why|how come|what's the reason)\b/i
      ],
      keywords: ['explain', 'describe', 'clarify', 'mean', 'why', 'reason'],
      priority: 1
    },
    
    {
      category: IntentCategory.TROUBLESHOOTING,
      patterns: [
        /\b(fix|solve|debug|troubleshoot|resolve)\b/i,
        /\b(error|problem|issue|bug|not working)\b/i,
        /\b(help.*problem|assistance.*issue)\b/i
      ],
      keywords: ['fix', 'solve', 'debug', 'troubleshoot', 'resolve', 'error', 'problem', 'issue', 'bug'],
      priority: 1
    }
  ];

  detectIntent(input: string): Intent {
    const normalizedInput = input.toLowerCase().trim();
    const matches: Array<{ category: IntentCategory; confidence: number; action: string; subject: string }> = [];

    // Pattern-based detection
    for (const pattern of this.intentPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedInput)) {
          const confidence = this.calculatePatternConfidence(normalizedInput, pattern);
          const { action, subject } = this.extractActionAndSubject(input, pattern.category);
          
          matches.push({
            category: pattern.category,
            confidence,
            action,
            subject
          });
          break; // Found a match for this pattern category
        }
      }
    }

    // Keyword-based detection (lower confidence)
    if (matches.length === 0) {
      for (const pattern of this.intentPatterns) {
        const keywordMatches = pattern.keywords.filter(keyword => 
          normalizedInput.includes(keyword.toLowerCase())
        );
        
        if (keywordMatches.length > 0) {
          const confidence = (keywordMatches.length / pattern.keywords.length) * 0.6; // Lower confidence for keywords
          const { action, subject } = this.extractActionAndSubject(input, pattern.category);
          
          matches.push({
            category: pattern.category,
            confidence,
            action,
            subject
          });
        }
      }
    }

    // Return the highest confidence match, or default
    if (matches.length > 0) {
      const bestMatch = matches.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
      
      return {
        category: bestMatch.category,
        action: bestMatch.action,
        subject: bestMatch.subject,
        confidence: Math.min(bestMatch.confidence, 0.95) // Cap confidence at 95%
      };
    }

    // Default fallback
    return {
      category: IntentCategory.INFORMATION_REQUEST,
      action: 'request information',
      subject: this.extractSubject(input),
      confidence: 0.3
    };
  }

  classifyType(input: string): PromptType {
    const normalizedInput = input.toLowerCase().trim();
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for vague inquiries
    if (this.isVagueInquiry(normalizedInput)) {
      return PromptType.VAGUE_INQUIRY;
    }
    
    // Check for multi-part requests
    if (sentences.length > 2 || normalizedInput.includes(' and ') || normalizedInput.includes(' also ')) {
      return PromptType.MULTI_PART_REQUEST;
    }
    
    // Check for specific tasks
    if (this.isSpecificTask(normalizedInput)) {
      return PromptType.SPECIFIC_TASK;
    }
    
    // Check for conversational patterns
    if (this.isConversational(normalizedInput)) {
      return PromptType.CONVERSATIONAL;
    }
    
    return PromptType.SINGLE_QUESTION;
  }

  extractKeywords(input: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = input
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequency and return most frequent
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private calculatePatternConfidence(input: string, pattern: IntentPattern): number {
    let confidence = 0.7; // Base confidence for pattern match
    
    // Boost confidence based on keyword presence
    const keywordMatches = pattern.keywords.filter(keyword => 
      input.includes(keyword.toLowerCase())
    );
    confidence += (keywordMatches.length / pattern.keywords.length) * 0.2;
    
    // Adjust for pattern priority
    confidence += (3 - pattern.priority) * 0.05;
    
    return Math.min(confidence, 0.95);
  }

  private extractActionAndSubject(input: string, category: IntentCategory): { action: string; subject: string } {
    const words = input.toLowerCase().split(/\s+/);
    
    let action = '';
    let subject = '';
    
    switch (category) {
      case IntentCategory.CODE_GENERATION:
        action = words.find(w => ['write', 'create', 'generate', 'build', 'implement'].includes(w)) || 'create';
        subject = this.extractSubject(input) || 'code';
        break;
        
      case IntentCategory.INFORMATION_REQUEST:
        action = words.find(w => ['tell', 'explain', 'describe', 'define'].includes(w)) || 'provide information';
        subject = this.extractSubject(input);
        break;
        
      case IntentCategory.TASK_EXECUTION:
        action = 'provide steps';
        subject = input.replace(/^(how\s+to|how\s+do\s+i|how\s+can\s+i)\s+/i, '').trim();
        break;
        
      case IntentCategory.COMPARISON:
        action = 'compare';
        subject = this.extractComparisonSubjects(input);
        break;
        
      default:
        action = 'respond to';
        subject = this.extractSubject(input);
    }
    
    return { action, subject };
  }

  private extractSubject(input: string): string {
    // Remove common question words and extract the main subject
    const cleaned = input
      .replace(/^(what|how|why|when|where|which|who|can you|please|could you)\s+/i, '')
      .replace(/\?$/, '')
      .trim();
    
    // Take first few meaningful words
    const words = cleaned.split(/\s+/).slice(0, 4);
    return words.join(' ') || 'this topic';
  }

  private extractComparisonSubjects(input: string): string {
    const comparison = input.match(/(\w+)\s+(vs|versus|compared to|against)\s+(\w+)/i);
    if (comparison) {
      return `${comparison[1]} and ${comparison[3]}`;
    }
    return this.extractSubject(input);
  }

  private isVagueInquiry(input: string): boolean {
    const vaguePatterns = [
      /^(what|how|why)\s*\?*$/i,
      /^(tell me|explain)\s*\?*$/i,
      /^(help|assistance)\s*\?*$/i,
      /^.{1,15}\?*$/
    ];
    
    return vaguePatterns.some(pattern => pattern.test(input));
  }

  private isSpecificTask(input: string): boolean {
    const specificPatterns = [
      /\b(create|build|implement|develop|write)\b.*\b(that|which|with)\b/i,
      /\bstep\s+\d+/i,
      /\b(first|then|next|finally)\b/i
    ];
    
    return specificPatterns.some(pattern => pattern.test(input));
  }

  private isConversational(input: string): boolean {
    const conversationalPatterns = [
      /^(hi|hello|hey|thanks|thank you)/i,
      /\b(please|could you|would you|can you help)\b/i,
      /\b(i need|i want|i'm looking for)\b/i
    ];
    
    return conversationalPatterns.some(pattern => pattern.test(input));
  }
}