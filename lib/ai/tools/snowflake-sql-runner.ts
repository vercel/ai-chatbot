import { tool } from 'ai';
import { z } from 'zod';

export const snowflakeToolPrompt = `
you are a helpful assistant that can execute SQL queries against a Snowflake database.
after executing the query, you should return the result in a table format or provide a summary of the result.
When there is a chain of queries, you should execute them one by one and return the result of each query and summary of the result.
`;

export const snowflakeSqlTool = tool({
  description: `
  Execute SQL queries against a Snowflake database and return results in a structured format.
  
  Capabilities:
  - Execute single SQL query
  - Return results in table format with proper formatting
  - Provide summary statistics for query results
  - Handle query chains by executing sequentially and reporting each result
  
  Guidelines:
  - Always validate query syntax before execution
  - Format large result sets appropriately (limit rows if needed)
  - Provide meaningful summaries for complex queries
  - Handle errors gracefully with clear error messages
  `,
  parameters: z.object({
    query: z.string().describe('The SQL query to execute'),
  }),
  execute: async ({ query }) => {
    try {
      console.log(`Snowflake SQL tool called with query: ${query}`);

      const response = await fetch(`${process.env.SNOWFLAKE_API_URL}/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SNOWFLAKE_API_URL_API_KEY}`,
        },
        body: JSON.stringify({ sql: query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Snowflake API error: ${response.status} - ${errorText}`);
        return {
          error: true,
          message: `Query failed: ${response.status} - ${errorText}`,
          query,
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
        query,
      };
    }
  },
});
