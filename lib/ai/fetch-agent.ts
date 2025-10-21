import { Agent } from "https";

// Tạo custom agent để bỏ qua SSL verification cho mạng nội bộ
export const createUnsafeAgent = () => {
  return new Agent({
    rejectUnauthorized: false,
  });
};

// Custom fetch function cho Node.js environment
export const createCustomFetch = () => {
  if (typeof window !== "undefined") {
    // Browser environment - sử dụng fetch mặc định
    return fetch;
  }

  // Node.js environment - sử dụng node-fetch với custom agent
  const https = require("https");
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  
  return (url: string, options: any = {}) => {
    return fetch(url, {
      ...options,
      agent,
    });
  };
};
