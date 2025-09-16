import { tool } from 'ai';
import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().describe('Name of the product'),
  characteristics: z.string().describe('Characteristics of the product').optional(),
  quantity: z.number(),
  price: z.number(),
})

export const PDFSchema = z.object({
  templateName: z.enum(["emonaev", "remmark", "sdk"]).describe('Организация, от лица которой мы выставляем коммерческое предложение'),
  filename: z.string(),
  products: z.array(ProductSchema),
})

export const createPdf = tool({
  description: 'Создает коммерческое предложение в виде pdf файла. Вызывать только если пользователь конкретно попросит дать ему коммерческое предложение.',
  inputSchema: PDFSchema,
  execute: async ({ filename, products, templateName = 'remmark' }) => {
    return { filename, products, templateName };
  }
});

// Default export is a4 paper, portrait, using millimeters for units
