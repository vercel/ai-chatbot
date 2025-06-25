import { tool } from 'ai';
import { z } from 'zod';

export const getChart = tool({
  description: 'Generate a chart image using QuickChart service',
  parameters: z.object({
    chartConfig: z.object({
      type: z.string().describe('Chart type (bar, line, pie, doughnut, etc.)'),
      data: z.object({
        labels: z.array(z.string()).describe('Chart labels'),
        datasets: z.array(z.object({
          label: z.string().describe('Dataset label'),
          data: z.array(z.number()).describe('Dataset values'),
          backgroundColor: z.array(z.string()).optional().describe('Background colors for data points'),
          borderColor: z.array(z.string()).optional().describe('Border colors for data points'),
        })).describe('Chart datasets'),
      }).describe('Chart data configuration'),
      options: z.object({}).optional().describe('Additional chart options'),
    }).describe('Chart.js configuration object'),
  }),
  execute: async ({ chartConfig }) => {
    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
    
    try {
      const response = await fetch(chartUrl);
      
      if (!response.ok) {
        throw new Error(`QuickChart API returned ${response.status}: ${response.statusText}`);
      }
      
      return {
        success: true,
        imageUrl: chartUrl,
        chartConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        chartConfig,
      };
    }
  },
});