# Snowflake SQL Runner Tool

## Overview

The Snowflake SQL Runner is an AI tool that enables the chatbot to execute SQL queries against a Snowflake database. This tool is part of the AI SDK tool system and provides a secure, controlled way for the AI assistant to interact with Snowflake data warehouses.

**Location**: `lib/ai/tools/snowflake-sql-runner.ts`

## Architecture

### Dependencies
- `ai` - AI SDK tool framework
- `zod` - Schema validation and type safety

### Component Structure
```typescript
snowflakeSqlTool = tool({
  description: 'Execute a SQL query against Snowflake database',
  parameters: z.object({
    query: z.string().describe('The SQL query to execute'),
  }),
  execute: async ({ query }) => { /* implementation */ }
})
```

## Core Functionality

### Input Parameters
- **query** (string): The SQL query to execute against the Snowflake database

### Return Types

#### Success Response
```typescript
{
  success: true,
  query: string,        // The executed query
  data: any,           // Query results
  rowCount: number     // Number of rows returned
}
```

#### Error Response
```typescript
{
  error: true,
  message: string,     // Error description
  query: string        // The query that failed
}
```

## Environment Configuration

### Required Environment Variables

1. **SNOWFLAKE_API_URL** - The base URL for your Snowflake API endpoint
2. **SNOWFLAKE_API_URL_API_KEY** - Bearer token for authentication

### Example Configuration
```bash
SNOWFLAKE_API_URL=https://your-account.snowflakecomputing.com/api/v2
SNOWFLAKE_API_URL_API_KEY=your-bearer-token-here
```

## Integration with AI System

### Tool Registration
The tool must be registered in the AI system's tool configuration. It integrates with the AI SDK's tool framework to provide structured SQL execution capabilities.

### Usage in Chat Context
When the AI assistant needs to query data, it can invoke this tool with natural language requests that get converted to SQL queries.

## Use Cases

### 1. Data Analysis Queries
```sql
SELECT department, AVG(salary) as avg_salary 
FROM employees 
GROUP BY department 
ORDER BY avg_salary DESC;
```

### 2. Reporting and Metrics
```sql
SELECT DATE_TRUNC('month', order_date) as month,
       SUM(total_amount) as monthly_revenue
FROM orders 
WHERE order_date >= '2024-01-01'
GROUP BY month
ORDER BY month;
```

### 3. Data Exploration
```sql
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT customer_id) as unique_customers
FROM transactions
WHERE transaction_date >= CURRENT_DATE - 30;
```

### 4. Schema Discovery
```sql
SHOW TABLES IN DATABASE your_database;
DESCRIBE TABLE your_table;
```

## Error Handling

The tool implements comprehensive error handling for:

### Network Errors
- Connection timeouts
- Network unavailability
- DNS resolution failures

### API Errors  
- Authentication failures (401)
- Authorization errors (403)
- Rate limiting (429)
- Server errors (5xx)

### SQL Errors
- Syntax errors
- Permission errors
- Table/column not found
- Data type mismatches

## Security Considerations

### Input Validation
- SQL queries are passed as strings without client-side validation
- Relies on Snowflake's built-in SQL parsing and validation

### Authentication
- Uses Bearer token authentication
- Tokens should be rotated regularly
- Environment variables prevent token exposure in code

### Recommendations
1. **Implement SQL injection protection** at the API gateway level
2. **Use read-only database users** for this tool when possible
3. **Implement query logging** for audit purposes
4. **Set query timeouts** to prevent long-running queries
5. **Monitor API usage** to detect anomalous behavior

## Modification Guidelines

### Adding Query Validation
```typescript
// Add input validation before execution
const validateQuery = (query: string): boolean => {
  // Implement whitelist of allowed SQL operations
  const allowedOperations = ['SELECT', 'SHOW', 'DESCRIBE'];
  const upperQuery = query.trim().toUpperCase();
  return allowedOperations.some(op => upperQuery.startsWith(op));
};
```

### Enhanced Error Response
```typescript
// Add more detailed error information
return {
  error: true,
  message: errorText,
  query,
  timestamp: new Date().toISOString(),
  errorCode: response.status,
  retryable: response.status >= 500
};
```

### Query Optimization
```typescript
// Add query metadata
return {
  success: true,
  query,
  data,
  rowCount: Array.isArray(data) ? data.length : 0,
  executionTime: Date.now() - startTime,
  queryHash: generateQueryHash(query)
};
```

### Adding Query Caching
```typescript
// Implement query result caching
const cacheKey = `snowflake:${hashQuery(query)}`;
const cachedResult = await cache.get(cacheKey);
if (cachedResult) {
  return { ...cachedResult, fromCache: true };
}
```

## Testing Strategies

### Unit Testing
```typescript
// Mock the fetch API for testing
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

test('successful query execution', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve([{ id: 1, name: 'test' }])
  });
  
  const result = await snowflakeSqlTool.execute({ 
    query: 'SELECT * FROM test_table' 
  });
  
  expect(result.success).toBe(true);
  expect(result.rowCount).toBe(1);
});
```

### Integration Testing
```typescript
// Test with actual Snowflake connection
test('real database connection', async () => {
  const result = await snowflakeSqlTool.execute({
    query: 'SELECT CURRENT_TIMESTAMP() as now'
  });
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});
```

## Performance Considerations

### Query Optimization
- Monitor slow-running queries through logging
- Implement query timeout mechanisms
- Consider result set size limitations

### Connection Management
- Reuse connections when possible
- Implement connection pooling at the API level
- Monitor connection limits

### Caching Strategy
- Cache frequently accessed reference data
- Implement cache invalidation for real-time data
- Use query fingerprinting for cache keys

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify SNOWFLAKE_API_URL_API_KEY is correct
   - Check token expiration
   - Ensure proper Bearer token format

2. **Network Timeouts**
   - Check SNOWFLAKE_API_URL accessibility
   - Verify firewall/proxy settings
   - Consider increasing timeout values

3. **Query Failures**
   - Check SQL syntax
   - Verify table/column existence
   - Ensure proper permissions

4. **Rate Limiting**
   - Implement exponential backoff
   - Monitor API usage quotas
   - Consider request batching

### Debug Logging
The tool includes console logging for debugging:
- Query execution logging
- Error details logging
- Response data logging (in development)

## Future Enhancements

### Potential Improvements
1. **Query builder interface** for complex queries
2. **Result visualization** for data analysis
3. **Query history and favorites**
4. **Real-time query monitoring**
5. **Advanced security features** (query approval workflows)
6. **Multi-database support** (beyond Snowflake)
7. **Query performance analytics**
8. **Automated data discovery** and schema exploration

### Scalability Considerations
- Connection pooling implementation
- Query result streaming for large datasets
- Distributed query execution
- Load balancing across multiple Snowflake accounts