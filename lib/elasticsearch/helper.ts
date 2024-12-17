import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const createUserElasticSearchPrompt = (elasticsearchResults: string) => `
  You are a conversational assistant. Construct a clear and informative response to the user message.
  
  Use the following Elasticsearch results as your source:
  "${elasticsearchResults}"
  
  Your response should:
  1. Directly address the user's query.
  2. Incorporate relevant information from the Elasticsearch results.
  3. Present the information in a user-friendly tone, avoiding technical jargon unless necessary.
  4. Include links or metadata from the Elasticsearch results, if available, for user reference.
  5. Avoid speculating or including information not present in the results.
  6. always answer in the language the user used.
  7. Only answer questions related to the Elasticsearch results.
`;

export const getElasticsearchResults = async (query: string) => {
  return fetch('/api/elasticsearch', {
    method: 'POST',
    body: query,
  });
};

export const generateQuery = (message: string) => `
    You are an expert in generating optimized Elasticsearch queries. Your task is as follows:
    1. Generate an Elasticsearch query that retrieves the most relevant documents based on the user's message: "${message}".
    2. Use appropriate field targeting for better accuracy (e.g., "title" for headline searches, "content" for body text).
    3. If the query requires filtering (e.g., date ranges or tags), include the necessary filters.
    4. Return only a valid JSON object in the following structure:
    {
      "query": {
        "query_string": {
          "query": "USER_MESSAGE"
        }
      },
      "sort": [
        {
          "@timestamp": {
            "order": "desc"
          }
        }
      ],
      "size": N  // optional: specify the number of results if relevant
    }
    5. here is an example of a valid query:
    {
      "query": {
        "query_string": {
          "query": "4952327692024"
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
    4. Sort by relevance using the '@timestamp' field.
    5. Absolutely no explanations, comments, or text outside the JSON object should be included.
    
    Output the JSON query now.
`;

async function getOptimizedQuery(elasticsearchPrompt: string): Promise<string | null> {
  try {
    const { text: optimizedElasticsearchQuery } = await generateText({
      model: openai('gpt-4'),
      prompt: elasticsearchPrompt,
    });
    return optimizedElasticsearchQuery;
  } catch (error) {
    console.error('Error generating text for Elasticsearch prompt:', error);
    return null;
  }
}

export type ElasticsearchQuery = {
  query: {
    multi_match: {
      query: string;
      fields: string[];
    };
  };
  sort: Array<{
    '@timestamp': {
      order: 'desc' | 'asc';
    };
  }>;
};

export async function generateElasticsearchPrompt(message: string): Promise<ElasticsearchQuery | null> {
  try {
    const elasticsearchPrompt = generateQuery(message);
    const optimizedQuery = await getOptimizedQuery(elasticsearchPrompt);

    if (!optimizedQuery) {
      console.error('Optimized Elasticsearch query is empty or null.');
      return null;
    }

    const parsedQuery: ElasticsearchQuery = JSON.parse(optimizedQuery);
    return parsedQuery;
  } catch (error) {
    console.error('Error generating Elasticsearch prompt:', error);
    return null;
  }
}

export async function fetchFromElasticsearch(query: ElasticsearchQuery): Promise<any> {
  console.log('fetching from elasticsearch with query:', JSON.stringify(query));
  const response = await fetch('http://localhost:9200/filebeat-*/_search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa('elastic:changeme'), // Replace with your actual username and password
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`Elasticsearch error: ${response.statusText}`);
  }

  return response.json();
}
