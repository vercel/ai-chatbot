# Stripe Payment Integration Setup Guide

This guide will help you integrate Stripe payments into your AI Chatbot application.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- PostgreSQL database configured
- Node.js and pnpm installed

## Step 1: Install Dependencies

```bash
pnpm install
```

This will install the new Stripe dependencies:
- `stripe` - Stripe Node.js library
- `@stripe/stripe-js` - Stripe.js for client-side

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important:** Use test mode keys during development!

## Step 3: Run Database Migrations

Generate and run the migration to add Stripe tables:

```bash
pnpm db:generate
pnpm db:migrate
```

This creates the following tables:
- `Customer` - Maps users to Stripe customers
- `Product` - Stripe products
- `Price` - Pricing information
- `Subscription` - User subscriptions

## Step 4: Set Up Stripe Webhook

### For Local Development:

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Production:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `product.created`
   - `product.updated`
   - `product.deleted`
   - `price.created`
   - `price.updated`
   - `price.deleted`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret to your production environment variables

## Step 5: Create Products and Prices in Stripe

### Option A: Using Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Create your products with pricing (monthly/yearly)

### Option B: Using Stripe CLI Fixtures

Create a `fixtures.json` file:

```json
{
  "_meta": {
    "template_version": 0
  },
  "fixtures": [
    {
      "name": "prod_basic",
      "path": "/v1/products",
      "method": "post",
      "params": {
        "name": "Basic",
        "description": "Basic plan"
      }
    },
    {
      "name": "price_basic_month",
      "path": "/v1/prices",
      "method": "post",
      "params": {
        "product": "${prod_basic:id}",
        "currency": "usd",
        "unit_amount": 1000,
        "recurring": {
          "interval": "month"
        }
      }
    }
  ]
}
```

Then run:
```bash
stripe fixtures fixtures.json
```

## Step 6: Configure Stripe Customer Portal

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Enable the following:
   - "Allow customers to update their payment methods"
   - "Allow customers to update subscriptions"
   - "Allow customers to cancel subscriptions"
3. Add your products and prices
4. Set up business information and links

## Step 7: Test the Integration

1. Start your development server:
```bash
pnpm dev
```

2. In another terminal, start webhook forwarding:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Visit http://localhost:3000/pricing to see your pricing page
4. Test checkout with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Available Routes

- `/pricing` - View and subscribe to plans
- `/account` - Manage subscription and billing

## Key Files Created

- `lib/stripe/config.ts` - Stripe client configuration
- `lib/stripe/client.ts` - Client-side Stripe helpers
- `lib/stripe/server.ts` - Server actions for checkout
- `lib/stripe/admin.ts` - Admin functions for webhooks
- `lib/stripe/helpers.ts` - Utility functions
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `components/pricing.tsx` - Pricing page component
- `components/customer-portal-form.tsx` - Account management
- `app/(chat)/pricing/page.tsx` - Pricing page
- `app/(chat)/account/page.tsx` - Account page

## Going Live

1. Switch to live mode in Stripe dashboard
2. Update environment variables with live keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `STRIPE_SECRET_KEY` (starts with `sk_live_`)
3. Create production webhook endpoint
4. Update `NEXT_PUBLIC_SITE_URL` to your production domain
5. Archive test products
6. Create live products and prices

## Troubleshooting

### Webhook not receiving events
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret matches in `.env.local`
- Verify endpoint URL is correct

### Products not showing
- Check products are marked as "active" in Stripe
- Verify webhook events are being received
- Check database tables have data

### Checkout fails
- Verify user is authenticated
- Check Stripe keys are correct
- Review browser console and server logs

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
