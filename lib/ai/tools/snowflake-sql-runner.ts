import { tool } from 'ai';
import { z } from 'zod';

export const snowflakeSqlTool = tool({
    description: 'Execute a SQL query against Snowflake database',
    parameters: z.object({
      query: z.string().describe('The SQL query to execute'),
    }),
    execute: async ({ query }) => {
      try {
        console.log(`Snowflake SQL tool called with query: ${query}`);
        
        const response = await fetch( process.env.SNOWFLAKE_API_URL + '/sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${process.env.SNOWFLAKE_API_URL_API_KEY}`
          },
          body: JSON.stringify({ sql: query }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Snowflake API error: ${response.status} - ${errorText}`);
          return { 
            error: true, 
            message: `Query failed: ${response.status} - ${errorText}`,
            query 
          };
        }
  
        const data = await response.json();
        console.log('Snowflake SQL query result:', data);
        
        return {
          success: true,
          query,
          data,
          rowCount: Array.isArray(data) ? data.length : 0,
        };
      } catch (error) {
        console.error('Snowflake SQL tool error:', error);
        return { 
          error: true, 
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          query 
        };
      }
    },
  });