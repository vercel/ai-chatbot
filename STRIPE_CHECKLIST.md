# Stripe Integration Checklist

Use this checklist to ensure your Stripe integration is properly set up.

## ☑️ Initial Setup

- [ ] Install dependencies: `pnpm install`
- [ ] Create Stripe account at https://stripe.com
- [ ] Get test API keys from https://dashboard.stripe.com/test/apikeys
- [ ] Add environment variables to `.env`:
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `NEXT_PUBLIC_SITE_URL`

## ☑️ Database Setup

- [ ] Generate migration: `pnpm db:generate`
- [ ] Run migration: `pnpm db:migrate`
- [ ] Verify tables created:
  - [ ] Customer
  - [ ] Product
  - [ ] Price
  - [ ] Subscription

## ☑️ Stripe Configuration

- [ ] Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Login to Stripe: `pnpm stripe:login`
- [ ] Start webhook forwarding: `pnpm stripe:listen`
- [ ] Copy webhook secret to `.env`

## ☑️ Products & Pricing

Choose one option:

### Option A: Stripe Dashboard
- [ ] Go to https://dashboard.stripe.com/test/products
- [ ] Create products with monthly/yearly prices
- [ ] Mark products as "active"

### Option B: Fixtures File
- [ ] Run: `pnpm stripe:fixtures`
- [ ] Verify products in dashboard

## ☑️ Customer Portal Setup

- [ ] Go to https://dashboard.stripe.com/test/settings/billing/portal
- [ ] Enable "Allow customers to update their payment methods"
- [ ] Enable "Allow customers to update subscriptions"
- [ ] Enable "Allow customers to cancel subscriptions"
- [ ] Add products and prices
- [ ] Set business information

## ☑️ Testing

- [ ] Start dev server: `pnpm dev`
- [ ] Start webhook listener: `pnpm stripe:listen` (separate terminal)
- [ ] Visit http://localhost:3000/pricing
- [ ] Test checkout with card: `4242 4242 4242 4242`
- [ ] Verify webhook events received
- [ ] Check subscription in database
- [ ] Visit http://localhost:3000/account
- [ ] Test customer portal access

## ☑️ Verification

- [ ] Products display on pricing page
- [ ] Checkout redirects to Stripe
- [ ] Payment succeeds
- [ ] Webhook creates subscription
- [ ] Account page shows subscription
- [ ] Customer portal opens
- [ ] Can update payment method
- [ ] Can cancel subscription

## ☑️ Production Deployment

- [ ] Switch to live mode in Stripe
- [ ] Get live API keys
- [ ] Update environment variables:
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
  - [ ] `STRIPE_SECRET_KEY` (sk_live_...)
- [ ] Create production webhook:
  - [ ] URL: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Select all relevant events
  - [ ] Copy webhook secret
- [ ] Update `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Archive test products
- [ ] Create live products and prices
- [ ] Test with real card (small amount)
- [ ] Verify production webhooks working

## ☑️ Security Review

- [ ] API keys not committed to git
- [ ] Webhook secret configured
- [ ] HTTPS enabled in production
- [ ] Authentication required for checkout
- [ ] Customer portal requires login
- [ ] Environment variables secured

## ☑️ Documentation

- [ ] Team knows how to add products
- [ ] Webhook monitoring set up
- [ ] Error logging configured
- [ ] Support process defined

## 🎉 Launch Ready!

Once all items are checked, your Stripe integration is ready for production!

## 📝 Notes

- Keep test and live environments separate
- Monitor webhook delivery in Stripe dashboard
- Set up alerts for failed payments
- Review Stripe logs regularly
- Test subscription lifecycle (create, update, cancel)

## 🆘 Need Help?

- Quick Start: `STRIPE_QUICK_START.md`
- Full Guide: `STRIPE_SETUP.md`
- Summary: `INTEGRATION_SUMMARY.md`
- Stripe Docs: https://stripe.com/docs
