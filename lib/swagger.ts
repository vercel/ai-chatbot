import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * Generates the Swagger/OpenAPI specification for the API
 * This processes JSDoc comments in API route files to generate documentation
 */
export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'AI Chatbot API Documentation',
        version: '1.0.0',
        description: 'API endpoints for the AI Chatbot application',
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Application server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          SessionAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'next-auth.session-token',
          },
        },
      },
      tags: [
        {
          name: 'Projects',
          description: 'Project management endpoints',
        },
        {
          name: 'Authentication',
          description: 'Authentication endpoints',
        },
      ],
    },
  });
  
  return spec;
};