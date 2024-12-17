import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const generateQuery = (message: string) => `
    You are a helpful expert which generates mysql queries based on user messages. Your task is as follows:

    1. Generate a MySQL query that retrieves the most relevant documents based on the user's message: "${message}".
    2. You can select from the following tables: "users", "vehicles".
    3. If the message does not match one of the tables from the list mentioned in step 2, return an empty string.
    4. never rename the tables or columns.
    5. Never output any comments or explanations.
    
    Output the MySQL query now.
`;

export async function createAtlasDBQuery(userPrompt: string): Promise<string | null> {
  const query = generateQuery(userPrompt);

  try {
    const { text: optimizedElasticsearchQuery } = await generateText({
      model: openai('gpt-4'),
      prompt: query,
    });
    return optimizedElasticsearchQuery;
  } catch (error) {
    console.error('Error generating text for Elasticsearch prompt:', error);
    return null;
  }
}
