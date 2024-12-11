export const createUserElasticSearchPrompt = (message: string, elasticsearchResults: string) => `
  You are a conversational assistant. Construct a clear and informative response to the user message: "${message}".
  
  Use the following Elasticsearch results as your source:
  "${elasticsearchResults}"
  
  Your response should:
  1. Directly address the user's query.
  2. Incorporate relevant information from the Elasticsearch results.
  3. Present the information in a user-friendly tone, avoiding technical jargon unless necessary.
  4. Include links or metadata from the Elasticsearch results, if available, for user reference.
  5. Avoid speculating or including information not present in the results.
  6. always answer in the language the user used.
`;

export const getElasticsearchResults = async (query: string) => {
  return fetch('/api/elasticsearch', {
    method: 'POST',
    body: query,
  });
};

export const generatePrompt = (message: string) => `
    You are an expert in generating optimized Elasticsearch queries. Your task is as follows:
    1. Generate an Elasticsearch query that retrieves the most relevant documents based on the user's message: "${message}".
    2. Use appropriate field targeting for better accuracy (e.g., "title" for headline searches, "content" for body text).
    3. If the query requires filtering (e.g., date ranges or tags), include the necessary filters.
    4. Return only a valid JSON object in the following structure:
    {
        "query": { ... },
        "sort": [ ... ],
        "size": N  // optional: specify the number of results if relevant
    }
    5. Sort by relevance using score or timestamp as appropriate.
    6. Absolutely no explanations, comments, or text outside the JSON object should be included.
    
    Output the JSON query now.
`;

export const generateQuery = async (message: string) => {
  const prompt = generatePrompt(message);

  const response = await fetch('/api/completion', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
    }),
  });

  const data = await response.json();

  return data.text;
};
