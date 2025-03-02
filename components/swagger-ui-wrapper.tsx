'use client';

import { useEffect, useState, memo } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import with SSR disabled to avoid rendering issues with Swagger UI
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * Generate a unique key for the SwaggerUI component in development mode
 * This is a workaround for the UNSAFE_componentWillReceiveProps warning
 * that comes from the swagger-ui-react package
 */
const getSwaggerKey = () => {
  if (process.env.NODE_ENV === 'development') {
    return `swagger-ui-${Math.random()}`;
  }
  return 'swagger-ui-stable';
};

// Create a memoized SwaggerUI component to reduce rerenders
const MemoizedSwaggerUI = memo(({ spec }: { spec: Record<string, any> }) => (
  <SwaggerUI key={getSwaggerKey()} spec={spec} />
));
MemoizedSwaggerUI.displayName = 'MemoizedSwaggerUI';

interface SwaggerUIWrapperProps {
  url?: string;
}

/**
 * A wrapper for SwaggerUI that handles fetching the OpenAPI spec and applying styling
 */
export default function SwaggerUIWrapper({ url = '/api/swagger' }: SwaggerUIWrapperProps) {
  const [spec, setSpec] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchSpec() {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to load API spec: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setSpec(data);
        }
      } catch (err) {
        console.error('Error loading API spec:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error loading API documentation');
        }
      }
    }
    
    fetchSpec();
    
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        <div className="text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-lg">Loading API documentation...</div>
      </div>
    );
  }

  return (
    <div className="swagger-wrapper">
      <MemoizedSwaggerUI spec={spec} />
      
      {/* Global styles for Swagger UI */}
      <style jsx global>{`
        .swagger-ui .information-container {
          padding: 20px 0;
        }
        .swagger-ui .scheme-container {
          padding: 15px 0;
        }
        /* Hide the "Download" buttons */
        .swagger-ui .download-contents {
          display: none;
        }
        /* Improve readability */
        .swagger-ui .opblock-summary-description {
          text-align: right;
          padding-right: 10px;
        }
        /* Make sure JSON examples are properly formatted */
        .swagger-ui .highlight-code pre {
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}