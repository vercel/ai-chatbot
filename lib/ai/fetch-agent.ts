// Custom fetch function cho Node.js environment
export const createCustomFetch = () => {
  if (typeof window !== "undefined") {
    // Browser environment - sử dụng fetch mặc định
    return fetch;
  }

  // Node.js environment - sử dụng undici với custom dispatcher
  const { fetch: undiciFetch, Agent } = require("undici");
  
  const agent = new Agent({
    connect: {
      rejectUnauthorized: false,
    },
  });
  
  return (url: string, options: any = {}) => {
    return undiciFetch(url, {
      ...options,
      dispatcher: agent,
    });
  };
};
