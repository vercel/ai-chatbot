# Stripe Integration Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Add Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Database Migration
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Start Stripe Webhook Listener
In a separate terminal:
```bash
pnpm stripe:listen
```
Copy the webhook secret (whsec_...) to your `.env.local`

### 5. Create Products in Stripe
Go to https://dashboard.stripe.com/test/products and create your products with prices.

### 6. Start Development Server
```bash
pnpm dev
```

Visit http://localhost:3000/pricing to see your pricing page!

## 📁 What Was Added

### Database Tables
- `Customer` - Links users to Stripe customers
- `Product` - Stripe products
- `Price` - Product pricing
- `Subscription` - User subscriptions

### API Routes
- `/api/webhooks/stripe` - Handles Stripe webhook events

### Pages
- `/pricing` - Pricing and subscription page
- `/account` - Manage subscription

### Components
- `components/pricing.tsx` - Pricing display
- `components/customer-portal-form.tsx` - Subscription management

### Utilities
- `lib/stripe/config.ts` - Stripe configuration
- `lib/stripe/client.ts` - Client-side helpers
- `lib/stripe/server.ts` - Server actions
- `lib/stripe/admin.ts` - Webhook handlers
- `lib/stripe/helpers.ts` - Utility functions

## 🧪 Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Use any future expiry date and any CVC.

## 📚 Full Documentation

See `STRIPE_SETUP.md` for detailed setup instructions and troubleshooting.
