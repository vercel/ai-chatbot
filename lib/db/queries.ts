import { db } from "@/lib/db";
import { product, price, subscription } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getProducts() {
  const products = await db
    .select()
    .from(product)
    .where(eq(product.active, true));

  const productsWithPrices = await Promise.all(
    products.map(async (prod) => {
      const prices = await db
        .select()
        .from(price)
        .where(and(eq(price.productId, prod.id), eq(price.active, true)));

      return {
        ...prod,
        prices,
      };
    })
  );

  return productsWithPrices;
}

export async function getSubscription(userId: string) {
  const subscriptions = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, ["trialing", "active"])
      )
    )
    .limit(1);

  if (!subscriptions.length) return null;

  const sub = subscriptions[0];
  const priceData = await db
    .select()
    .from(price)
    .where(eq(price.id, sub.priceId))
    .limit(1);

  if (!priceData.length) return null;

  const productData = await db
    .select()
    .from(product)
    .where(eq(product.id, priceData[0].productId))
    .limit(1);

  return {
    ...sub,
    price: {
      ...priceData[0],
      product: productData[0],
    },
  };
}
