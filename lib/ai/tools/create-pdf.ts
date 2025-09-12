import { tool } from 'ai';
import { z } from 'zod';

export const createPdf = tool({
  description: 'Generate a pdf file with the given list of products and filename',
  inputSchema: z.object({
    filename: z.string(),
    products: z.array(z.object({
      ordinalNumber: z.number(),
      name: z.string(),
      characteristics: z.string(),
      quantity: z.number(),
      price: z.number(),
    }))
  }),
  execute: async ({ filename, products }) => {
    return { filename, products };
  }
});

// Default export is a4 paper, portrait, using millimeters for units
