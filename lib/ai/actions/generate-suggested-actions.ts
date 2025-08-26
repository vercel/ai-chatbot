'use server';

import { generateObject } from 'ai';
import { z } from 'zod';
import { myProvider } from '../providers';

const suggestedActionSchema = z.object({
  title: z.string().describe('Short title for the action (max 3-4 words)'),
  label: z.string().describe('Descriptive subtitle for the action'),
  action: z.string().describe('Full question or command text to send'),
});

const suggestedActionsSchema = z.object({
  actions: z.array(suggestedActionSchema).describe('Array of suggested actions (should be 4 items)'),
});

export async function generateSuggestedActions(): Promise<Array<{
  title: string;
  label: string;
  action: string;
}>> {
  try {
    const { object } = await generateObject({
      model: myProvider.languageModel('suggestion-model'),
      system: `You are a helpful AI assistant that generates diverse and engaging conversation starters.
      
Generate 4 different suggested actions that users might want to try. The actions should be:
- Diverse (covering different categories like coding, writing, general knowledge, creative tasks)
- Engaging and interesting
- Clear and actionable
- Appropriate for a general audience

Each action should have:
- title: A short, catchy title (3-4 words max)
- label: A descriptive subtitle that completes or explains the title
- action: The full question or command that will be sent to the AI

Examples of good suggestions:
- Title: "Explain a concept", Label: "like quantum computing", Action: "Explain quantum computing in simple terms"
- Title: "Write code for", Label: "a sorting algorithm", Action: "Write code for a bubble sort algorithm in Python"
- Title: "Plan a trip to", Label: "Tokyo, Japan", Action: "Help me plan a 5-day trip to Tokyo, Japan"`,
      prompt: 'Generate exactly 4 diverse and engaging suggested actions for users to try.',
      schema: suggestedActionsSchema,
    });

    // Ensure we have exactly 4 actions
    const actions = object.actions;
    if (actions.length === 4) {
      return actions;
    } else if (actions.length > 4) {
      // Take first 4 if we got more
      return actions.slice(0, 4);
    } else {
      // If we got fewer than 4, pad with fallback actions
      const fallbackActions = [
        {
          title: 'What are the advantages',
          label: 'of using WhatsonYourMind?',
          action: 'What are the advantages of using WhatsonYourMind?',
        },
        {
          title: 'Write code to',
          label: `demonstrate djikstra's algorithm`,
          action: `Write code to demonstrate djikstra's algorithm`,
        },
        {
          title: 'Help me write an essay',
          label: `about India's silicon valley`,
          action: `Help me write an essay about India's silicon valley`,
        },
        {
          title: 'What is the weather',
          label: 'in Bangalore?',
          action: 'What is the weather in Bangalore?',
        },
      ];
      
      // Add fallback actions to reach 4 total
      const needed = 4 - actions.length;
      return [...actions, ...fallbackActions.slice(0, needed)];
    }

    return object.actions;
  } catch (error) {
    console.error('Failed to generate suggested actions:', error);
    
    // Fallback to default actions if AI generation fails
    return [
      {
        title: 'What are the advantages',
        label: 'of using WhatsonYourMind?',
        action: 'What are the advantages of using WhatsonYourMind?',
      },
      {
        title: 'Write code to',
        label: `demonstrate djikstra's algorithm`,
        action: `Write code to demonstrate djikstra's algorithm`,
      },
      {
        title: 'Help me write an essay',
        label: `about India's silicon valley`,
        action: `Help me write an essay about India's silicon valley`,
      },
      {
        title: 'What is the weather',
        label: 'in Bangalore?',
        action: 'What is the weather in Bangalore?',
      },
    ];
  }
}
