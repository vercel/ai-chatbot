import { createUserElasticSearchPrompt, generateQuery, getElasticsearchResults } from '@/lib/elasticsearch/helper';
import { useChat } from 'ai/react';
import { useState } from 'react';

export const useElasticAIAssist = ({
  body,
  initialMessages,
  onFinish,
}: {
  body: { id: string; modelId: string };
  initialMessages: any;
  onFinish: () => void;
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chat = useChat({ body, initialMessages, onFinish });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await chat.append({ role: 'data', content: input });
      await chat.append({
        role: 'assistant',
        content: 'Bitte warten Sie, während wir Ihre Anfrage verarbeiten...',
      });

      const optimizedQuery = await generateQuery(input);
      const elasticSearchResponse = await getElasticsearchResults(optimizedQuery);
      const elasticSearchResults = await elasticSearchResponse.json();
      const promptWithElasticsearchResults = createUserElasticSearchPrompt(input, JSON.stringify(elasticSearchResults));

      await chat.append({ role: 'user', content: promptWithElasticsearchResults });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setInput('');
      console.error('Error:', error);
    }
  };

  return { ...chat, isLoading, handleSubmit, input, setInput };
};
