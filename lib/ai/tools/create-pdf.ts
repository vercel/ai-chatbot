import { tool } from 'ai';
import { z } from 'zod';

export const ProductSchema = z.object({
      name: z.string().describe('Name of the product'),
      characteristics: z.string().describe('Characteristics of the product').optional(),
      quantity: z.number(),
      price: z.number(),
})

export const PDFSchema = z.object({
  filename: z.string(),
  products: z.array(ProductSchema),
})

export const createPdf = tool({
  description: 'Generate a pdf file with the given list of products and filename',
  inputSchema: PDFSchema,
  execute: async ({ filename, products }) => {
    return { filename, products };
  }
});

// Default export is a4 paper, portrait, using millimeters for units
