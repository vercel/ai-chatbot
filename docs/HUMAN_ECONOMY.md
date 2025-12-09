# TiQology Human Economy System

**Version:** 1.0  
**Status:** Production Ready  
**Directive:** ECON-2025-12-07-HUMAN-ECONOMY  
**Integration Date:** December 7, 2025

---

## 🎯 Overview

The **Human Economy** is TiQology's financial infrastructure that transforms the platform from a functional operating system into a **living economic system**. It connects users, subscriptions, affiliates, and financial telemetry into a cohesive, self-aware financial ecosystem.

### Core Capabilities

1. **User Identity & Access** - User profiles, roles, and organizations
2. **Subscription Management** - Stripe-integrated billing and plan management
3. **Affiliate System** - CK1/EK2/DK3 referral codes with commission tracking
4. **Financial Telemetry** - Real-time metrics integrated with AgentOS
5. **API Layer** - RESTful endpoints for all economy operations

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   TiQology Human Economy                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Users &    │  │ Subscription │  │  Affiliate   │      │
│  │ Organizations│  │  Management  │  │    System    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                   │             │
│         └─────────────────┴───────────────────┘             │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  Financial      │                        │
│                  │  Telemetry      │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │   AgentOS       │                        │
│                  │  Integration    │                        │
│                  └─────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables (10)

#### 1. **tiq_users** - User Identity
- User profiles with handle, email, role
- Affiliate tracking (is_affiliate, affiliate_code, referred_by_code)
- Activity tracking (last_seen_at)
- Metadata for extensibility

#### 2. **tiq_organizations** - Teams & Companies
- Organization profiles
- Owner assignment
- Plan-based limits (seats)

#### 3. **tiq_organization_members** - Team Membership
- User-to-organization relationships
- Role assignment (owner, admin, member)

#### 4. **tiq_plans** - Subscription Tiers
- **Basic** ($9.99/mo) - Individual users
- **Pro** ($29.99/mo) - Power users
- **Elite** ($99.99/mo) - Teams
- **Enterprise** (Custom) - Enterprises
- Stripe product/price IDs
- Feature flags and limits

#### 5. **tiq_subscriptions** - User Subscriptions
- User or organization subscriptions
- Stripe integration (customer_id, subscription_id, payment_method_id)
- Billing period (monthly/yearly)
- Lifecycle tracking (trial, current period, cancellation)

#### 6. **tiq_subscription_events** - Subscription Telemetry
- Event log for all subscription changes
- Created, status_changed, plan_changed, payment events
- Integrated with AgentOS event log

#### 7. **tiq_affiliates** - Affiliate Partners
- Affiliate codes (CK1, EK2, DK3 format)
- Commission rates (20% recurring, 30% one-time)
- Earnings tracking (total, pending, paid)

#### 8. **tiq_referrals** - Referral Relationships
- Affiliate-to-user connections
- Referral status (pending → active → churned)
- Commission tracking per referral

#### 9. **tiq_affiliate_payouts** - Payout Records
- Payout requests and processing
- Status workflow (pending → processing → completed/failed)
- Payment method details

#### 10. **tiq_affiliate_commissions** - Commission Transactions
- Individual commission records
- Commission types (recurring, one_time, bonus)
- Link to payouts when processed

### Key Functions (9)

1. **generate_affiliate_code(initials)** - Sequential CK1, EK2, DK3 generation
2. **update_user_role_from_subscription()** - Auto-update role based on plan
3. **update_affiliate_stats_on_referral()** - Auto-calculate referral metrics
4. **update_affiliate_earnings()** - Track earnings and payouts
5. **get_human_economy_metrics()** - Complete financial dashboard
6. **get_economy_realtime_metrics()** - Real-time system-wide metrics
7. **get_user_financial_profile(user_id)** - User financial overview
8. **get_affiliate_performance_report(affiliate_id, period_days)** - Affiliate analytics
9. **calculate_user_ltv(user_id)** - Lifetime value calculation

---

## 🔧 Backend Modules

Located in `lib/humanEconomy/`:

### 1. **userManagement.ts**
```typescript
// User CRUD operations
createUser(params)
getUserById(id) / getUserByAuthId(authId) / getUserByHandle(handle)
updateUser(id, updates)
deleteUser(id) // Soft delete
updateUserLastSeen(id)

// Referral tracking
createReferralFromCode(affiliateCode, userId)

// Statistics
getUserStats(id)
isHandleAvailable(handle)
searchUsers(query)
```

### 2. **subscriptionManagement.ts**
```typescript
// Plan management
getActivePlans()
getPlanById(id) / getPlanByCode(code)

// Subscription CRUD
createSubscription(params)
getSubscriptionById(id)
getUserSubscription(userId)
getOrganizationSubscription(orgId)
updateSubscription(id, updates)
cancelSubscription(id, cancelAtPeriodEnd)

// Stripe integration
createCheckoutSession(planId, userId, billingPeriod, successUrl, cancelUrl)
handleStripeWebhook(eventType, eventData)
```

### 3. **affiliateSystem.ts**
```typescript
// Affiliate registration
registerAffiliate(userId, customCode?)
getAffiliateById(id) / getAffiliateByUserId(userId) / getAffiliateByCode(code)

// Referral tracking
trackReferral(affiliateCode, referredUserId)
getAffiliateReferrals(affiliateId, status?)

// Commission management
createCommission(affiliateId, referralId, subscriptionId, type, amount)
getAffiliateCommissions(affiliateId, status?)
approveCommission(commissionId)

// Payout management
createPayout(affiliateId, amount, paymentMethod, paymentDetails)
updatePayoutStatus(payoutId, status)
getAffiliatePayouts(affiliateId)

// Dashboard
getAffiliateDashboard(affiliateId) // Comprehensive stats
```

---

## 🌐 API Endpoints

### Users (`/api/economy/users`)

**GET** - Get current user or search
- `?q=<query>` - Search users by handle/name
- `?handle=<handle>` - Get user by handle
- `?check_handle=<handle>` - Check handle availability
- Default: Get current user with stats

**POST** - Create new user
```json
{
  "auth_user_id": "uuid",
  "email": "user@example.com",
  "handle": "username",
  "display_name": "Full Name",
  "referred_by_code": "CK1" // Optional
}
```

**PATCH** - Update current user
```json
{
  "display_name": "New Name",
  "bio": "Bio text",
  "avatar_url": "https://...",
  "country": "US",
  "timezone": "America/New_York"
}
```

### Subscriptions (`/api/economy/subscriptions`)

**GET** - Get plans or current subscription
- `?action=plans` - Get all active plans
- Default: Get current user's subscription

**POST** - Create subscription or checkout session
```json
{
  "action": "checkout", // or omit for direct creation
  "plan_code": "pro",
  "billing_period": "monthly", // or "yearly"
  "success_url": "https://...",
  "cancel_url": "https://..."
}
```

**PATCH** - Update subscription
```json
{
  "subscription_id": "uuid",
  "plan_id": "uuid", // Optional - upgrade/downgrade
  "billing_period": "yearly", // Optional - change period
  "status": "paused" // Optional - change status
}
```

**DELETE** - Cancel subscription
- `?id=<subscription_id>` - Subscription to cancel
- `?cancel_at_period_end=true` - Schedule cancellation (default: true)

### Affiliates (`/api/economy/affiliates`)

**GET** - Get affiliate info or dashboard
- `?action=validate&code=<code>` - Validate affiliate code
- `?action=dashboard` - Get comprehensive dashboard
- `?action=referrals&status=active` - Get referrals
- `?action=commissions&status=pending` - Get commissions
- `?action=payouts` - Get payout history
- Default: Get affiliate info

**POST** - Register or track referral
```json
{
  "action": "register", // Become an affiliate
  "custom_code": "MYCODE" // Optional
}

// OR

{
  "action": "track_referral", // Track a referral
  "referral_code": "CK1"
}

// OR

{
  "action": "request_payout", // Request payout
  "amount": 100.00,
  "payment_method": "paypal",
  "payment_details": { "email": "affiliate@example.com" }
}
```

**PATCH** - Approve commission (admin only)
```json
{
  "commission_id": "uuid"
}
```

### Metrics (`/api/economy/metrics`)

**GET** - Get real-time metrics
- `?type=overview` - System-wide economy metrics
- `?type=user_profile` - Current user's financial profile
- `?type=affiliate_performance&period_days=30` - Affiliate performance report
- `?type=subscription_analytics&period_days=30` - Subscription analytics (admin)
- `?type=user_ltv` - Calculate current user's LTV

**POST** - Log custom economy event
```json
{
  "event_type": "custom_action",
  "metadata": { "key": "value" }
}
```

---

## 🔑 Affiliate Code System (CK1/EK2/DK3)

### Logic

The affiliate code system generates unique codes based on user initials:

1. **Extract Initials**: From display_name or handle
   - "Chris Knight" → "CK"
   - "Emma Davis" → "ED"

2. **Sequential Numbering**: Database function generates next available number
   - First CK affiliate → "CK1"
   - Second CK affiliate → "CK2"
   - Third CK affiliate → "CK3"

3. **Code Format**: `[INITIALS][NUMBER]`
   - Always uppercase
   - No special characters
   - Unique per affiliate

### Database Function

```sql
CREATE FUNCTION generate_affiliate_code(initials text)
RETURNS text
AS $$
DECLARE
  code_prefix text;
  next_number integer;
  new_code text;
BEGIN
  code_prefix := UPPER(TRIM(initials));
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(affiliate_code FROM LENGTH(code_prefix) + 1) AS integer)), 0) + 1
  INTO next_number
  FROM tiq_affiliates
  WHERE affiliate_code ~ ('^' || code_prefix || '[0-9]+$');
  
  new_code := code_prefix || next_number::text;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### Usage Example

```typescript
// User "Chris Knight" registers as affiliate
const affiliate = await registerAffiliate(userId);
// affiliate.affiliate_code = "CK1"

// User "Chris Kim" registers later
const affiliate2 = await registerAffiliate(userId2);
// affiliate2.affiliate_code = "CK2"

// Custom code (if available)
const affiliate3 = await registerAffiliate(userId3, "MYCODE");
// affiliate3.affiliate_code = "MYCODE"
```

---

## 💰 Commission System

### Commission Rates

- **One-Time**: 30% of first payment
- **Recurring**: 20% of each renewal

### Workflow

1. **User Signs Up** with referral code
   - Referral record created (status: pending)
   
2. **User Subscribes**
   - Referral status → active
   - One-time commission created (30%)
   
3. **Monthly Renewal**
   - Recurring commission created (20%)
   
4. **Affiliate Requests Payout**
   - All approved commissions assigned to payout
   - Payout status: pending → processing → completed
   
5. **Commission Marked as Paid**
   - Linked to payout record

### Approval Process

```typescript
// Admin approves commission
await approveCommission(commissionId);

// Affiliate requests payout
await createPayout(affiliateId, 100.00, 'paypal', { email: 'affiliate@example.com' });

// Admin processes payout
await updatePayoutStatus(payoutId, 'processing');
await updatePayoutStatus(payoutId, 'completed');
```

---

## 📈 Telemetry & Analytics

### Real-Time Metrics

```typescript
// System-wide overview
const metrics = await fetch('/api/economy/metrics?type=overview');
/*
{
  "timestamp": "2025-12-07T...",
  "users": {
    "total": 1250,
    "active_last_7_days": 450,
    "by_role": { "free": 800, "pro": 350, "elite": 100 }
  },
  "subscriptions": {
    "total_active": 450,
    "mrr": 12500.00,
    "arr": 150000.00,
    "by_plan": { "basic": 200, "pro": 200, "elite": 50 }
  },
  "affiliates": {
    "total_affiliates": 75,
    "active_referrals": 300,
    "total_earnings": 15000.00,
    "pending_earnings": 2500.00
  }
}
*/
```

### User Financial Profile

```typescript
const profile = await fetch('/api/economy/metrics?type=user_profile');
/*
{
  "user_id": "uuid",
  "handle": "cknight",
  "subscription": {
    "plan": "Pro",
    "status": "active",
    "amount": 29.99,
    "current_period_end": "2025-01-07"
  },
  "affiliate_stats": {
    "affiliate_code": "CK1",
    "total_referrals": 25,
    "active_referrals": 18,
    "total_earnings": 450.00,
    "pending_earnings": 120.00
  },
  "lifetime_value": 359.88
}
*/
```

### Affiliate Performance Report

```typescript
const report = await fetch('/api/economy/metrics?type=affiliate_performance&period_days=30');
/*
{
  "affiliate_code": "CK1",
  "period": { "start_date": "...", "end_date": "...", "days": 30 },
  "period_stats": {
    "new_referrals": 5,
    "referrals_converted": 3,
    "commissions_earned": 89.97,
    "payouts_received": 0.00
  },
  "commission_breakdown": {
    "one_time": { "count": 3, "total_amount": 26.97 },
    "recurring": { "count": 7, "total_amount": 63.00 }
  }
}
*/
```

---

## 🚀 Deployment

### Database Migrations

1. **Migration 004** - Core schema
```bash
psql $DATABASE_URL -f docs/migrations/004_human_economy.sql
```

2. **Migration 005** - Telemetry functions
```bash
psql $DATABASE_URL -f docs/migrations/005_economy_telemetry.sql
```

### Environment Variables

```env
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe (Test)
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
```

### Deployment Directive

Use the automated deployment directive:

```bash
devin-ops execute ops/directives/samples/deploy-human-economy.yaml
```

This will:
1. Create deployment branch
2. Run database migrations via `/supabase migrate`
3. Deploy to Vercel via `/vercel deploy production`
4. Run smoke tests
5. Validate telemetry integration

---

## 🧪 Testing

### Manual Testing Workflow

1. **Create Test User**
```bash
curl -X POST http://localhost:3000/api/economy/users \
  -H "Content-Type: application/json" \
  -d '{
    "auth_user_id": "test-user-1",
    "email": "test@example.com",
    "handle": "testuser"
  }'
```

2. **Register as Affiliate**
```bash
curl -X POST http://localhost:3000/api/economy/affiliates \
  -H "Content-Type: application/json" \
  -d '{ "action": "register" }'
```

3. **Create Subscription**
```bash
curl -X POST http://localhost:3000/api/economy/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "plan_code": "pro",
    "billing_period": "monthly"
  }'
```

4. **Check Metrics**
```bash
curl http://localhost:3000/api/economy/metrics?type=overview
```

### Automated Tests

Create test directive: `ops/directives/tests/test-human-economy.yaml`

```yaml
directive:
  id: TEST-ECON-2025-12-07
  name: "Test Human Economy System"
  priority: high
  
steps:
  - step_id: test_user_creation
    description: "Create test users"
    command: "node tests/economy/test-users.js"
    
  - step_id: test_subscriptions
    description: "Test subscription flow"
    command: "node tests/economy/test-subscriptions.js"
    
  - step_id: test_affiliates
    description: "Test affiliate system"
    command: "node tests/economy/test-affiliates.js"
```

---

## 📚 Integration with AgentOS

All Human Economy events are automatically logged to `agentos_event_log`:

### Event Types

- `subscription_created` - New subscription
- `subscription_status_changed` - Status update
- `subscription_plan_changed` - Plan upgrade/downgrade
- `affiliate_registered` - New affiliate
- `referral_created` - New referral tracked
- `commission_created` - Commission generated
- `payout_requested` - Payout requested
- `economy_custom_action` - Custom events via API

### Querying Events

```sql
-- Recent subscription activity
SELECT * FROM agentos_event_log
WHERE event_type LIKE 'subscription_%'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Affiliate performance
SELECT 
  metadata->>'affiliate_code' as code,
  COUNT(*) as referrals
FROM agentos_event_log
WHERE event_type = 'referral_created'
  AND created_at > now() - interval '30 days'
GROUP BY metadata->>'affiliate_code';
```

---

## 🛠️ Future Enhancements

### Phase 2: TiQology EarnHub

- **Action Rewards**: Earn credits for completing tasks
- **Referral Bonuses**: Extra commissions for milestones
- **Survey Rewards**: Get paid for feedback
- **Gamification**: Leaderboards and achievement badges

### Phase 3: Advanced Analytics

- **Cohort Analysis**: Track user cohorts over time
- **Predictive Churn**: ML-based churn prediction
- **LTV Optimization**: Automated retention campaigns
- **A/B Testing**: Test pricing and features

### Phase 4: International Support

- **Multi-Currency**: Support EUR, GBP, JPY, etc.
- **Tax Compliance**: VAT/GST handling
- **Localized Pricing**: Region-specific plans

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Affiliate code generation fails  
**Solution**: Ensure migration 004 ran successfully, check `generate_affiliate_code()` function exists

**Issue**: Referral not activating on subscription  
**Solution**: Check `referred_by_code` is set on user, verify referral record exists

**Issue**: Commission not created  
**Solution**: Verify subscription has valid payment, check affiliate status is 'active'

**Issue**: Metrics returning null  
**Solution**: Run migration 005 for telemetry functions

### Debug Queries

```sql
-- Check affiliate code conflicts
SELECT affiliate_code, COUNT(*) 
FROM tiq_affiliates 
GROUP BY affiliate_code 
HAVING COUNT(*) > 1;

-- Find pending referrals without subscriptions
SELECT r.*, u.handle 
FROM tiq_referrals r
JOIN tiq_users u ON r.referred_user_id = u.id
WHERE r.status = 'pending'
  AND r.created_at < now() - interval '7 days';

-- Audit commission accuracy
SELECT 
  c.id,
  c.amount as commission_amount,
  c.commission_rate,
  c.subscription_payment_amount,
  (c.subscription_payment_amount * c.commission_rate / 100) as expected_amount
FROM tiq_affiliate_commissions c
WHERE c.amount != (c.subscription_payment_amount * c.commission_rate / 100);
```

---

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review `ops/directives/samples/deploy-human-economy.yaml`
3. Check AgentOS event logs for error details
4. Contact platform team

---

## 📝 Changelog

### v1.0 (December 7, 2025)
- Initial release
- 10 database tables
- 9 SQL functions
- 3 backend modules
- 4 API endpoints
- Complete affiliate system (CK1/EK2/DK3)
- Stripe integration (placeholder)
- AgentOS telemetry integration

---

**End of Documentation**

Built with ❤️ by the TiQology AgentOS Team  
Directive: ECON-2025-12-07-HUMAN-ECONOMY  
Status: Mission Accomplished ✅
