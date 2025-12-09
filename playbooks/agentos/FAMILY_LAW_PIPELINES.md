# Family Law Pipelines - AgentOS Integration

## Overview

This document describes how TiQology's **Best Interest Engine** and other family law features integrate with **AgentOS** for AI-powered legal analysis.

## Best Interest Evaluation Pipeline

### Purpose

Provide AI-powered "Best Interest of the Child" evaluations for family law cases using a 4-dimensional scoring framework.

### Pipeline Flow

```
User Input (TiQology-spa)
    ↓
bestInterestEvaluationPipeline()
    ↓
AgentTask (kind: evaluation, domain: family-law)
    ↓
Agent Router
    ↓
best-interest-engine agent
    ↓
Ghost API (with specialized prompt)
    ↓
4-Dimensional Scores + Analysis
    ↓
AgentResult returned to app
```

### Usage

#### From TiQology-spa

```typescript
import { bestInterestEvaluationPipeline } from '@/lib/agentos/pipelines';

const result = await bestInterestEvaluationPipeline(
  {
    parentingPlan: 'Joint legal custody, primary physical with Mother...',
    communication: 'Weekly email check-ins, minimal conflict...',
    incidents: 'No documented safety incidents in past 12 months...',
    childProfile: '7-year-old girl, no special needs, strong bonds with both parents...',
    model: 'claude-3-7-sonnet-latest' // or 'claude-3-5-haiku-latest' for fast
  },
  {
    origin: 'tiqology-spa',
    userId: 'user_123',
    sessionId: 'session_456'
  }
);

// Result structure
const scores = result.result.data;
console.log(scores.stability);        // 0-100
console.log(scores.safety);           // 0-100
console.log(scores.cooperation);      // 0-100
console.log(scores.emotionalImpact);  // 0-100
console.log(scores.overall);          // 0-100
console.log(scores.summary);          // Executive summary
console.log(scores.recommendations);  // Array of recommendations
console.log(scores.concerns);         // Array of concerns
```

#### Direct API Call

```bash
curl -X POST https://ai-chatbot.vercel.app/api/agent-router \
  -H "Content-Type: application/json" \
  -H "x-api-key: $AGENTOS_API_KEY" \
  -d '{
    "task": {
      "id": "best-interest-001",
      "origin": "tiqology-spa",
      "targetAgents": ["best-interest-engine"],
      "domain": "family-law",
      "kind": "evaluation",
      "priority": "high",
      "payload": {
        "parentingPlan": "Joint legal custody...",
        "communication": "Weekly emails...",
        "incidents": "No incidents...",
        "childProfile": "7-year-old girl...",
        "model": "chat-model"
      }
    }
  }'
```

### Response Format

```json
{
  "taskId": "best-interest-001",
  "result": {
    "data": {
      "stability": 85,
      "safety": 92,
      "cooperation": 78,
      "emotionalImpact": 88,
      "overall": 86,
      "summary": "Overall assessment shows strong parental cooperation...",
      "recommendations": [
        "Continue weekly communication protocol",
        "Consider family counseling to strengthen co-parenting",
        "Document all parenting time exchanges"
      ],
      "concerns": [
        "Minor communication delays noted in 2 instances",
        "School notification coordination could be improved"
      ]
    },
    "summary": "Best Interest evaluation completed. Overall score: 86",
    "confidence": 0.86
  },
  "trace": {
    "steps": [
      {
        "timestamp": 1733519400000,
        "agent": "router",
        "action": "task_validated"
      },
      {
        "timestamp": 1733519402000,
        "agent": "router",
        "action": "agent_selected",
        "metadata": { "selectedAgent": "best-interest-engine" }
      },
      {
        "timestamp": 1733519403000,
        "agent": "best-interest-engine",
        "action": "execution_started"
      },
      {
        "timestamp": 1733519425000,
        "agent": "best-interest-engine",
        "action": "execution_completed",
        "duration": 22000
      }
    ],
    "totalDuration": 25000,
    "intermediateResults": {
      "ghostResponse": {...},
      "parsedScores": {...}
    }
  },
  "status": "completed",
  "completedAt": 1733519425000
}
```

## Scoring Framework

### 1. Stability & Continuity (0-100)

**Evaluates:**
- Residential stability
- Educational consistency
- Healthcare continuity
- Community connections
- Routine predictability

**Scoring:**
- 80-100: Excellent stability
- 60-79: Good stability with minor concerns
- 40-59: Fair, significant inconsistencies
- 0-39: Poor, major instability

### 2. Safety & Well-being (0-100)

**Evaluates:**
- Physical safety of environment
- Supervision quality
- Protection from harm
- Conflict management
- Risk factors

**Scoring:**
- 80-100: Excellent safety measures
- 60-79: Good with minor risks
- 40-59: Fair, notable concerns
- 0-39: Poor, significant safety risks

### 3. Parental Cooperation (0-100)

**Evaluates:**
- Communication effectiveness
- Flexibility
- Decision-making alignment
- Conflict resolution
- Agreement compliance

**Scoring:**
- 80-100: Excellent cooperation
- 60-79: Good with occasional friction
- 40-59: Fair, frequent conflicts
- 0-39: Poor, hostile co-parenting

### 4. Child's Emotional Impact (0-100)

**Evaluates:**
- Emotional security
- Relationship quality
- Parental support
- Exposure to adult conflict
- Developmental appropriateness

**Scoring:**
- 80-100: Excellent emotional health
- 60-79: Good with minor stressors
- 40-59: Fair, notable emotional strain
- 0-39: Poor, significant emotional harm

### Overall Assessment

Weighted average of all four dimensions, with additional consideration for:
- Pattern consistency
- Trend direction (improving/declining)
- Critical risk factors
- Protective factors

## Additional Family Law Pipelines

### Future Implementations

1. **Custody Agreement Analysis**
   - Analyze custody agreement documents
   - Flag ambiguous language
   - Score completeness (0-100)
   - Suggest improvements

2. **Communication Pattern Analysis**
   - Analyze email/text exchanges
   - Measure tone and cooperation
   - Identify concerning patterns
   - Generate cooperation scores

3. **Incident Report Evaluation**
   - Evaluate incident descriptions
   - Assess severity (0-100)
   - Identify safety concerns
   - Recommend interventions

4. **Child Preference Analysis**
   - Analyze child interview transcripts
   - Assess developmental appropriateness
   - Identify influence or coaching
   - Provide neutral summary

## Best Practices

### Input Quality

1. **Be Specific**: Provide concrete examples, not generalizations
2. **Be Objective**: Present facts without editorializing
3. **Be Complete**: Include all relevant information
4. **Be Current**: Focus on recent patterns (last 6-12 months)

### Interpreting Results

1. **Holistic Review**: Consider all scores together
2. **Context Matters**: AI analysis complements human judgment
3. **Verify Claims**: Cross-reference with case documentation
4. **Track Trends**: Compare evaluations over time

### Legal Considerations

⚠️ **Important Disclaimers:**

- AI provides analytical support, **NOT legal advice**
- Attorney must review and validate all outputs
- Do not input identifying information (use pseudonyms)
- Consider local family law standards and precedents
- Results are not admissible evidence without expert testimony

## Error Handling

### Common Issues

1. **Incomplete Input**: Provide all 4 required fields
2. **Timeout**: Use faster model (Haiku) for quick analysis
3. **API Errors**: Check API key and endpoint availability
4. **Invalid Scores**: Router validates 0-100 range

### Retry Strategy

```typescript
async function evaluateWithRetry(input, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await bestInterestEvaluationPipeline(input);
      if (result.status === 'completed') {
        return result;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Monitoring & Analytics

Track key metrics:
- Evaluation count by domain
- Average scores by category
- Processing time (p50, p95, p99)
- Error rates by error code
- User satisfaction ratings

---

**Version**: 1.0.0  
**Last Updated**: December 6, 2025  
**Domain**: Family Law  
**Status**: Production Ready
