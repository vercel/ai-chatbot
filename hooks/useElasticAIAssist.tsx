import { useChat } from "ai/react";
import { useState } from "react";

const getElasticsearchResults = async (query: string) => {
    return fetch('/api/elasticsearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': 'Basic ' + btoa('elastic:changeme') // Replace with your actual username and password
        },
        body: JSON.stringify(query)
    });
}

const generatePrompt = (message: string) => `
    You are an expert in generating Elasticsearch queries. Follow these instructions strictly:
    1. Generate an Elasticsearch query that retrieves only the most relevant data based on the user's message.
    2. Ensure the query uses separate fields for relevant information.
    3. Always output a valid JSON object with a consistent structure.
    4. Sort the results by relevance.
    5. Do not include any additional text, explanation, or formatting outside the JSON object.

    Example of expected output:
    {
        "query": {
        "bool": {
            "must": [
            {
                "match": {
                "message": "was ist der aktuelle status von fahrzeug 4952327692024"
                }
            }
            ]
        }
        },
        "sort": [
        {
            "@timestamp": {
            "order": "desc"
            }
        }
        ]
    }

    Based on the user's message: "${message}", generate the query and return only a valid JSON object.
    `;

const generateQuery = async (message: string) => {
    const prompt = generatePrompt(message);

    const response = await fetch('/api/completion', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
      }),
    });

    const data = await response.json();

    return data.text;
  }

const createUserElasticSearchPrompt = (message: string, elasticsearchResults: string) => `
    construct a good response based on the user message: "${message}" and the results from elastic search: "${elasticsearchResults}"
`

export const useElasticAIAssist = ({ body, initialMessages, onFinish }: { body: { id: string, modelId: string }, initialMessages: any, onFinish: () => void }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chat = useChat({ body, initialMessages, onFinish });
    
    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await chat.append({ role: 'data', content: input });
            // construct the query, inform user what we are doing
            await chat.append({ role: 'assistant', content: 'Generiere eine optimierte Elasticsearch-Abfrage basierend auf Ihrer Eingabe...' });
            const optimizedQuery = await generateQuery(chat.input);
            const elasticSearchResponse = await getElasticsearchResults(optimizedQuery);
            const elasticSearchResults = await elasticSearchResponse.json();
            const promptWithElasticsearchResults = createUserElasticSearchPrompt(chat.input, JSON.stringify(elasticSearchResults));

            await chat.append({ role: 'user', content: promptWithElasticsearchResults });
            setIsLoading(false);
            setInput('');
        } catch (error) {
            setIsLoading(false);
            setInput('')
            console.error('Error:', error);
        }
    }

    return { ...chat, isLoading, handleSubmit, input, setInput };
};