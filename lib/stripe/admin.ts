import { db } from "@/lib/db";
import { customer, price, product, subscription } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/config";
import { toDateTime } from "@/lib/stripe/helpers";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const TRIAL_PERIOD_DAYS = 0;

export const upsertProductRecord = async (stripeProduct: Stripe.Product) => {
  const productData = {
    id: stripeProduct.id,
    active: stripeProduct.active,
    name: stripeProduct.name,
    description: stripeProduct.description ?? null,
    image: stripeProduct.images?.[0] ?? null,
    metadata: stripeProduct.metadata,
  };

  await db
    .insert(product)
    .values(productData)
    .onConflictDoUpdate({
      target: product.id,
      set: productData,
    });

  console.log(`Product inserted/updated: ${stripeProduct.id}`);
};

export const upsertPriceRecord = async (
  stripePrice: Stripe.Price,
  retryCount = 0,
  maxRetries = 3
) => {
  const priceData = {
    id: stripePrice.id,
    productId:
      typeof stripePrice.product === "string" ? stripePrice.product : "",
    active: stripePrice.active,
    currency: stripePrice.currency,
    type: stripePrice.type as "one_time" | "recurring",
    unitAmount: stripePrice.unit_amount?.toString() ?? null,
    interval: (stripePrice.recurring?.interval as
      | "day"
      | "week"
      | "month"
      | "year"
      | null) ?? null,
    intervalCount: stripePrice.recurring?.interval_count?.toString() ?? null,
    trialPeriodDays:
      stripePrice.recurring?.trial_period_days?.toString() ??
      TRIAL_PERIOD_DAYS.toString(),
  };

  try {
    await db
      .insert(price)
      .values(priceData)
      .onConflictDoUpdate({
        target: price.id,
        set: priceData,
      });

    console.log(`Price inserted/updated: ${stripePrice.id}`);
  } catch (error: any) {
    if (error?.message?.includes("foreign key constraint")) {
      if (retryCount < maxRetries) {
        console.log(`Retry attempt ${retryCount + 1} for price ID: ${stripePrice.id}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await upsertPriceRecord(stripePrice, retryCount + 1, maxRetries);
      } else {
        throw new Error(
          `Price insert/update failed after ${maxRetries} retries: ${error.message}`
        );
      }
    } else {
      throw error;
    }
  }
};

export const deleteProductRecord = async (stripeProduct: Stripe.Product) => {
  await db.delete(product).where(eq(product.id, stripeProduct.id));
  console.log(`Product deleted: ${stripeProduct.id}`);
};

export const deletePriceRecord = async (stripePrice: Stripe.Price) => {
  await db.delete(price).where(eq(price.id, stripePrice.id));
  console.log(`Price deleted: ${stripePrice.id}`);
};

const upsertCustomerToDatabase = async (uuid: string, customerId: string) => {
  await db
    .insert(customer)
    .values({ id: uuid, stripeCustomerId: customerId })
    .onConflictDoUpdate({
      target: customer.id,
      set: { stripeCustomerId: customerId },
    });

  return customerId;
};

const createCustomerInStripe = async (uuid: string, email: string) => {
  const customerData = { metadata: { userId: uuid }, email: email };
  const newCustomer = await stripe.customers.create(customerData);
  if (!newCustomer) throw new Error("Stripe customer creation failed.");
  return newCustomer.id;
};

export const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  const existingCustomer = await db.query.customer.findFirst({
    where: eq(customer.id, uuid),
  });

  let stripeCustomerId: string | undefined;
  if (existingCustomer?.stripeCustomerId) {
    const existingStripeCustomer = await stripe.customers.retrieve(
      existingCustomer.stripeCustomerId
    );
    stripeCustomerId = existingStripeCustomer.id;
  } else {
    const stripeCustomers = await stripe.customers.list({ email: email });
    stripeCustomerId =
      stripeCustomers.data.length > 0 ? stripeCustomers.data[0].id : undefined;
  }

  const stripeIdToInsert = stripeCustomerId
    ? stripeCustomerId
    : await createCustomerInStripe(uuid, email);

  if (!stripeIdToInsert) throw new Error("Stripe customer creation failed.");

  if (existingCustomer && stripeCustomerId) {
    if (existingCustomer.stripeCustomerId !== stripeCustomerId) {
      await db
        .update(customer)
        .set({ stripeCustomerId: stripeCustomerId })
        .where(eq(customer.id, uuid));
      console.warn(
        "Supabase customer record mismatched Stripe ID. Database record updated."
      );
    }
    return stripeCustomerId;
  } else {
    console.warn(
      "Database customer record was missing. A new record was created."
    );
    const upsertedStripeCustomer = await upsertCustomerToDatabase(
      uuid,
      stripeIdToInsert
    );
    if (!upsertedStripeCustomer)
      throw new Error("Database customer record creation failed.");
    return upsertedStripeCustomer;
  }
};

const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  const customerId = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;

  await stripe.customers.update(customerId, { name, phone, address });
};

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  const customerData = await db.query.customer.findFirst({
    where: eq(customer.stripeCustomerId, customerId),
  });

  if (!customerData) throw new Error("Customer lookup failed");

  const { id: uuid } = customerData;

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscriptionId,
    {
      expand: ["default_payment_method"],
    }
  );

  const subscriptionData = {
    id: stripeSubscription.id,
    userId: uuid,
    metadata: stripeSubscription.metadata,
    status: stripeSubscription.status as
      | "trialing"
      | "active"
      | "canceled"
      | "incomplete"
      | "incomplete_expired"
      | "past_due"
      | "unpaid"
      | "paused",
    priceId: stripeSubscription.items.data[0].price.id,
    quantity: stripeSubscription.items.data[0].quantity?.toString() ?? null,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    cancelAt: stripeSubscription.cancel_at
      ? toDateTime(stripeSubscription.cancel_at)
      : null,
    canceledAt: stripeSubscription.canceled_at
      ? toDateTime(stripeSubscription.canceled_at)
      : null,
    currentPeriodStart: toDateTime(stripeSubscription.current_period_start),
    currentPeriodEnd: toDateTime(stripeSubscription.current_period_end),
    created: toDateTime(stripeSubscription.created),
    endedAt: stripeSubscription.ended_at
      ? toDateTime(stripeSubscription.ended_at)
      : null,
    trialStart: stripeSubscription.trial_start
      ? toDateTime(stripeSubscription.trial_start)
      : null,
    trialEnd: stripeSubscription.trial_end
      ? toDateTime(stripeSubscription.trial_end)
      : null,
  };

  await db
    .insert(subscription)
    .values(subscriptionData)
    .onConflictDoUpdate({
      target: subscription.id,
      set: subscriptionData,
    });

  console.log(
    `Inserted/updated subscription [${stripeSubscription.id}] for user [${uuid}]`
  );

  if (
    createAction &&
    stripeSubscription.default_payment_method &&
    uuid
  ) {
    await copyBillingDetailsToCustomer(
      uuid,
      stripeSubscription.default_payment_method as Stripe.PaymentMethod
    );
  }
};
