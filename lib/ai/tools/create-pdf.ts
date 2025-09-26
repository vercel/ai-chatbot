import { tool } from "ai";
import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().describe("Name of the product"),
  characteristics: z
    .string()
    .describe("Characteristics of the product")
    .optional(),
  quantity: z.number(),
  price: z.number(),
});

export const PDFSchema = z.object({
  templateName: z
    .enum(["emonaev", "remmark", "sdk"])
    .describe(
      "Организация, от лица которой мы выставляем коммерческое предложение",
    ),
  filename: z.string(),
  products: z.array(ProductSchema),
  receiver: z.string().describe("Кому выписывается КП"),
  deliveryAddress: z.string().describe("Место поставки товара"),
  customerRequestNumber: z
    .string()
    .describe("Номер запроса клиента, в ответ на ваш запрос №???"),
  customerRequestDate: z.string().describe("Дата запроса клиента"),
  offerValidityPeriod: z
    .string()
    .describe("Срок действия предложения, до какой даты действительно"),
  deliveryPeriod: z.string().describe("Дата поставки товара, до"),
  offerDate: z.string().describe("Дата КП"),
  offerNumber: z.string().describe("Номер КП"),
});

export const createPdf = tool({
  description:
    "Создает коммерческое предложение в виде pdf файла. Вызывать только если пользователь конкретно попросит дать ему коммерческое предложение.",
  inputSchema: PDFSchema,
  execute: async ({
    filename,
    products,
    templateName = "remmark",
    receiver,
    deliveryAddress,
    customerRequestNumber,
    customerRequestDate,
    offerValidityPeriod,
    deliveryPeriod,
    offerDate,
    offerNumber,
  }) => {
    return {
      filename,
      products,
      templateName,
      receiver,
      deliveryAddress,
      customerRequestNumber,
      customerRequestDate,
      offerValidityPeriod,
      deliveryPeriod,
      offerDate,
      offerNumber,
    };
  },
});

// Default export is a4 paper, portrait, using millimeters for units
