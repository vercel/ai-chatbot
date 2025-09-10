import pino from 'pino';

export const logger = pino({
  name: 'omni',
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
