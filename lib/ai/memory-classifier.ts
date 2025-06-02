import { generateText } from 'ai';
import { myProvider } from './providers';
import { getMemoriesByUserId, saveMemory } from '@/lib/db/queries';
import type { Memory } from '@/lib/db/schema';
import { AISDKExporter } from 'langsmith/vercel';

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  // If no code blocks, return the text as-is
  return text.trim();
}

interface MemoryClassificationResult {
  isMemoryWorthy: boolean;
  content?: string;
  category?: string;
  tags?: string[];
  reasoning?: string;
}

interface ProcessMemoryParams {
  userId: string;
  messageContent: string;
  messageId: string;
  existingMemories: Memory[];
}

const CLASSIFICATION_PROMPT = `You are a memory classifier for a personal AI assistant. Your job is to analyze user messages and determine if they contain information worth remembering about the user.

Memorable information includes:
- Personal preferences (food, music, hobbies, etc.)
- Professional information (job, skills, projects, etc.)
- Goals and aspirations
- Important relationships and context
- Learning interests
- Personal facts and characteristics
- Project details and context
- Important decisions or opinions

NOT memorable:
- Temporary requests or questions
- General conversation
- Purely informational exchanges
- Technical troubleshooting without personal context

When you find memorable information:
1. Extract ONLY the most essential, factual information
2. Categorize it appropriately
3. Add relevant tags
4. Ensure it's not redundant with existing memories

Categories: Personal, Professional, Preferences, Goals, Projects, Learning, Ideas, Context, Other

Respond with ONLY valid JSON (no markdown formatting):
{
  "isMemoryWorthy": boolean,
  "content": "condensed memorable information",
  "category": "category name",
  "tags": ["tag1", "tag2"],
  "reasoning": "why this is worth remembering"
}

If not memory worthy, respond with:
{
  "isMemoryWorthy": false,
  "reasoning": "why this is not worth remembering"
}`;

const CONSOLIDATION_PROMPT = `You are a memory consolidator. Your job is to check if new memory information is redundant with existing memories and either:
1. Skip saving if it's redundant
2. Suggest updating an existing memory if it's related but different
3. Proceed with saving if it's truly new information

Existing memories:
{existingMemories}

New memory to check:
Content: {newContent}
Category: {newCategory}
Tags: {newTags}

Respond with ONLY valid JSON (no markdown formatting):
{
  "action": "save" | "skip" | "update",
  "reasoning": "explanation",
  "existingMemoryId": "id if updating",
  "updatedContent": "new content if updating"
}`;

export async function classifyMemory(
  messageContent: string,
  existingMemories: Memory[],
): Promise<MemoryClassificationResult> {
  try {
    const { text } = await generateText({
      model: myProvider.languageModel('title-model'), // Using GPT-4o mini
      prompt: `${CLASSIFICATION_PROMPT}

User message: "${messageContent}"

Existing memories to check against:
${existingMemories.map((m) => `- ${m.category}: ${m.content}`).join('\n')}`,
      temperature: 0.1,
      experimental_telemetry: AISDKExporter.getSettings({
        runName: 'classify-memory',
        metadata: {
          messageLength: messageContent.length,
          existingMemoriesCount: existingMemories.length,
        },
      }),
    });

    const cleanedText = extractJsonFromMarkdown(text);
    const result = JSON.parse(cleanedText) as MemoryClassificationResult;
    return result;
  } catch (error) {
    console.error('Memory classification error:', error);
    return { isMemoryWorthy: false, reasoning: 'Classification failed' };
  }
}

export async function consolidateMemory(
  newMemory: { content: string; category: string; tags: string[] },
  existingMemories: Memory[],
): Promise<{
  action: 'save' | 'skip' | 'update';
  reasoning: string;
  existingMemoryId?: string;
  updatedContent?: string;
}> {
  try {
    const { text } = await generateText({
      model: myProvider.languageModel('title-model'),
      prompt: CONSOLIDATION_PROMPT.replace(
        '{existingMemories}',
        existingMemories
          .map(
            (m) =>
              `ID: ${m.id}, Category: ${m.category}, Content: ${m.content}, Tags: ${m.tags.join(', ')}`,
          )
          .join('\n'),
      )
        .replace('{newContent}', newMemory.content)
        .replace('{newCategory}', newMemory.category)
        .replace('{newTags}', newMemory.tags.join(', ')),
      temperature: 0.1,
      experimental_telemetry: AISDKExporter.getSettings({
        runName: 'consolidate-memory',
        metadata: {
          newMemoryCategory: newMemory.category,
          newMemoryTagsCount: newMemory.tags.length,
          existingMemoriesCount: existingMemories.length,
        },
      }),
    });

    const cleanedText = extractJsonFromMarkdown(text);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Memory consolidation error:', error);
    return {
      action: 'save',
      reasoning: 'Consolidation failed, proceeding with save',
    };
  }
}

export async function processMemoryFromMessage({
  userId,
  messageContent,
  messageId,
  existingMemories,
}: ProcessMemoryParams): Promise<Memory | null> {
  try {
    // Step 1: Classify if the message contains memorable information
    const classification = await classifyMemory(
      messageContent,
      existingMemories,
    );

    if (!classification.isMemoryWorthy || !classification.content) {
      return null;
    }

    // Step 2: Check for consolidation with existing memories
    if (!classification.category) {
      return null;
    }

    const consolidation = await consolidateMemory(
      {
        content: classification.content,
        category: classification.category,
        tags: classification.tags || [],
      },
      existingMemories,
    );

    // Step 3: Execute the consolidation action
    if (consolidation.action === 'skip') {
      console.log('Skipping memory creation:', consolidation.reasoning);
      return null;
    }

    if (consolidation.action === 'update') {
      if (consolidation.existingMemoryId && consolidation.updatedContent) {
        // This would require updating the existing memory
        // For now, we'll just save as new to keep it simple
        console.log('Would update existing memory:', consolidation.reasoning);
      }
      // Continue to save as new memory
    }

    // Save the memory (for 'save', 'update', or default actions)
    const memory = await saveMemory({
      userId,
      content: classification.content,
      category: classification.category,
      tags: classification.tags || [],
      originalMessage: messageContent,
      originalMessageId: messageId,
    });

    console.log('Memory saved:', {
      content: classification.content,
      category: classification.category,
      reasoning: classification.reasoning,
    });

    return memory;
  } catch (error) {
    console.error('Error processing memory from message:', error);
    return null;
  }
}

export async function processMemoryForUser(
  userId: string,
  messageContent: string,
  messageId: string,
): Promise<Memory | null> {
  try {
    // Get existing memories for the user
    const existingMemories = await getMemoriesByUserId({
      userId,
      limit: 100, // Get all memories for context
    });

    return await processMemoryFromMessage({
      userId,
      messageContent,
      messageId,
      existingMemories,
    });
  } catch (error) {
    console.error('Error processing memory for user:', error);
    return null;
  }
}
