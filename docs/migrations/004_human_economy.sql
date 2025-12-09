-- ============================================
-- TIQOLOGY HUMAN ECONOMY LAYER v1.0
-- Migration 004: Accounts + Subscriptions + Affiliates
-- ============================================
-- This migration creates the complete financial infrastructure
-- for TiQology's Human Economy system.
--
-- Components:
-- 1. User Identity & Organizations
-- 2. Subscription Plans & Management (Stripe integration)
-- 3. Affiliate System (CK1/EK2/DK3 codes)
-- 4. Telemetry & Metrics
-- ============================================

-- ============================================
-- PART 1: USER IDENTITY & ORGANIZATIONS
-- ============================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS tiq_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth Integration
  auth_user_id UUID UNIQUE, -- Links to auth.users
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- User Identity
  handle VARCHAR(50) UNIQUE NOT NULL, -- @username
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  
  -- Profile
  country VARCHAR(3), -- ISO 3166-1 alpha-3
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  
  -- Role & Status
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- user, pro, elite, enterprise, admin
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  
  -- Affiliate Info
  is_affiliate BOOLEAN DEFAULT false,
  affiliate_code VARCHAR(20) UNIQUE, -- e.g., CK1, EK2, DK3
  referred_by_code VARCHAR(20), -- Who referred this user
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Organizations table
CREATE TABLE IF NOT EXISTS tiq_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  
  -- Contact
  billing_email VARCHAR(255),
  
  -- Ownership
  owner_user_id UUID REFERENCES tiq_users(id),
  
  -- Plan
  plan_type VARCHAR(50) DEFAULT 'basic', -- basic, pro, elite, enterprise
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS tiq_organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  organization_id UUID REFERENCES tiq_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tiq_users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_tiq_users_auth_user_id ON tiq_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tiq_users_email ON tiq_users(email);
CREATE INDEX IF NOT EXISTS idx_tiq_users_handle ON tiq_users(handle);
CREATE INDEX IF NOT EXISTS idx_tiq_users_affiliate_code ON tiq_users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_tiq_users_referred_by_code ON tiq_users(referred_by_code);
CREATE INDEX IF NOT EXISTS idx_tiq_users_role ON tiq_users(role);
CREATE INDEX IF NOT EXISTS idx_tiq_users_status ON tiq_users(status);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_tiq_organizations_owner ON tiq_organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tiq_organizations_slug ON tiq_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_tiq_org_members_org ON tiq_organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_tiq_org_members_user ON tiq_organization_members(user_id);

-- ============================================
-- PART 2: SUBSCRIPTION PLANS & MANAGEMENT
-- ============================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS tiq_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Identity
  plan_code VARCHAR(50) UNIQUE NOT NULL, -- basic, pro, elite, enterprise
  plan_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Features
  features JSONB DEFAULT '[]', -- Array of feature objects
  limits JSONB DEFAULT '{}', -- {messages: 100, agents: 1, storage_gb: 10}
  
  -- Stripe Integration
  stripe_product_id VARCHAR(255),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS tiq_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Subscriber
  user_id UUID REFERENCES tiq_users(id),
  organization_id UUID REFERENCES tiq_organizations(id),
  
  -- Plan
  plan_id UUID REFERENCES tiq_plans(id) NOT NULL,
  
  -- Billing
  billing_period VARCHAR(20) NOT NULL, -- monthly, yearly
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Stripe Integration
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_payment_method_id VARCHAR(255),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, past_due, canceled, paused
  
  -- Lifecycle
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Either user_id or organization_id must be set
  CONSTRAINT subscription_owner_check CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  )
);

-- Subscription events (telemetry)
CREATE TABLE IF NOT EXISTS tiq_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  subscription_id UUID REFERENCES tiq_subscriptions(id) ON DELETE CASCADE,
  
  -- Event
  event_type VARCHAR(100) NOT NULL, -- created, activated, canceled, renewed, payment_failed
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Details
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  
  -- Stripe
  stripe_event_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_tiq_subscriptions_user ON tiq_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_tiq_subscriptions_org ON tiq_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_tiq_subscriptions_plan ON tiq_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_tiq_subscriptions_status ON tiq_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tiq_subscriptions_stripe_customer ON tiq_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tiq_subscription_events_sub ON tiq_subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_tiq_subscription_events_type ON tiq_subscription_events(event_type);

-- ============================================
-- PART 3: AFFILIATE SYSTEM
-- ============================================

-- Affiliates
CREATE TABLE IF NOT EXISTS tiq_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES tiq_users(id) UNIQUE,
  
  -- Affiliate Code (e.g., CK1, EK2, DK3)
  affiliate_code VARCHAR(20) UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, inactive
  
  -- Commission Rates (percentages)
  commission_rate_recurring DECIMAL(5,2) DEFAULT 20.00, -- 20%
  commission_rate_one_time DECIMAL(5,2) DEFAULT 30.00, -- 30%
  
  -- Payout Info
  payout_method VARCHAR(50), -- stripe, paypal, bank_transfer
  payout_details JSONB DEFAULT '{}', -- Encrypted payment details
  minimum_payout_amount DECIMAL(10,2) DEFAULT 50.00,
  
  -- Stats (cached)
  total_referrals INTEGER DEFAULT 0,
  total_active_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_paid_out DECIMAL(10,2) DEFAULT 0.00,
  pending_payout DECIMAL(10,2) DEFAULT 0.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS tiq_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties
  affiliate_id UUID REFERENCES tiq_affiliates(id) NOT NULL,
  referred_user_id UUID REFERENCES tiq_users(id) NOT NULL,
  
  -- Tracking
  referral_code VARCHAR(20) NOT NULL, -- Copy of affiliate code for immutability
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, churned, fraudulent
  
  -- Subscription
  subscription_id UUID REFERENCES tiq_subscriptions(id),
  
  -- Commission Tracking
  first_payment_at TIMESTAMPTZ,
  total_commissions_earned DECIMAL(10,2) DEFAULT 0.00,
  total_commissions_paid DECIMAL(10,2) DEFAULT 0.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- UTM params, landing page, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(affiliate_id, referred_user_id)
);

-- Affiliate payouts
CREATE TABLE IF NOT EXISTS tiq_affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  affiliate_id UUID REFERENCES tiq_affiliates(id) NOT NULL,
  
  -- Payout Details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255), -- Stripe transfer ID, PayPal transaction ID, etc.
  
  -- Breakdown
  referrals_count INTEGER DEFAULT 0,
  recurring_commissions DECIMAL(10,2) DEFAULT 0.00,
  one_time_commissions DECIMAL(10,2) DEFAULT 0.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Affiliate commission transactions
CREATE TABLE IF NOT EXISTS tiq_affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  affiliate_id UUID REFERENCES tiq_affiliates(id) NOT NULL,
  referral_id UUID REFERENCES tiq_referrals(id) NOT NULL,
  subscription_id UUID REFERENCES tiq_subscriptions(id),
  payout_id UUID REFERENCES tiq_affiliate_payouts(id), -- NULL if not yet paid out
  
  -- Commission
  commission_type VARCHAR(50) NOT NULL, -- recurring, one_time, bonus
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Source
  subscription_payment_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, paid, reversed
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Indexes for affiliates
CREATE INDEX IF NOT EXISTS idx_tiq_affiliates_user ON tiq_affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_tiq_affiliates_code ON tiq_affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_tiq_affiliates_status ON tiq_affiliates(status);
CREATE INDEX IF NOT EXISTS idx_tiq_referrals_affiliate ON tiq_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tiq_referrals_user ON tiq_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_tiq_referrals_status ON tiq_referrals(status);
CREATE INDEX IF NOT EXISTS idx_tiq_payouts_affiliate ON tiq_affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tiq_payouts_status ON tiq_affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_tiq_commissions_affiliate ON tiq_affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tiq_commissions_referral ON tiq_affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_tiq_commissions_payout ON tiq_affiliate_commissions(payout_id);

-- ============================================
-- PART 4: HELPER FUNCTIONS
-- ============================================

-- Generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code(initials VARCHAR(2))
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  new_code VARCHAR(20);
BEGIN
  -- Get the highest number for these initials
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(affiliate_code FROM '[0-9]+$') AS INTEGER
      )
    ),
    0
  ) + 1
  INTO next_number
  FROM tiq_affiliates
  WHERE affiliate_code ~ ('^' || UPPER(initials) || '[0-9]+$');
  
  -- Generate code: e.g., CK1, EK2, DK3
  new_code := UPPER(initials) || next_number::TEXT;
  
  RETURN new_code;
END;
$$;

-- Update user role based on subscription
CREATE OR REPLACE FUNCTION update_user_role_from_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plan_code VARCHAR(50);
  new_role VARCHAR(50);
BEGIN
  -- Get plan code
  SELECT p.plan_code INTO plan_code
  FROM tiq_plans p
  WHERE p.id = NEW.plan_id;
  
  -- Map plan to role
  new_role := CASE plan_code
    WHEN 'basic' THEN 'user'
    WHEN 'pro' THEN 'pro'
    WHEN 'elite' THEN 'elite'
    WHEN 'enterprise' THEN 'enterprise'
    ELSE 'user'
  END;
  
  -- Update user role if subscription is active
  IF NEW.status = 'active' AND NEW.user_id IS NOT NULL THEN
    UPDATE tiq_users
    SET role = new_role, updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update user role when subscription changes
CREATE TRIGGER trigger_update_user_role
  AFTER INSERT OR UPDATE OF status, plan_id
  ON tiq_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role_from_subscription();

-- Update affiliate stats when referral created
CREATE OR REPLACE FUNCTION update_affiliate_stats_on_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tiq_affiliates
    SET 
      total_referrals = total_referrals + 1,
      total_active_referrals = total_active_referrals + 
        CASE WHEN NEW.status = 'active' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update active referral count on status change
    IF OLD.status != NEW.status THEN
      UPDATE tiq_affiliates
      SET 
        total_active_referrals = total_active_referrals + 
          CASE 
            WHEN NEW.status = 'active' AND OLD.status != 'active' THEN 1
            WHEN NEW.status != 'active' AND OLD.status = 'active' THEN -1
            ELSE 0
          END,
        updated_at = NOW()
      WHERE id = NEW.affiliate_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_affiliate_stats
  AFTER INSERT OR UPDATE OF status
  ON tiq_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats_on_referral();

-- Update affiliate earnings when commission created/updated
CREATE OR REPLACE FUNCTION update_affiliate_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tiq_affiliates
    SET 
      total_earnings = total_earnings + NEW.amount,
      pending_payout = pending_payout + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- When commission is paid out
    IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
      UPDATE tiq_affiliates
      SET 
        total_paid_out = total_paid_out + NEW.amount,
        pending_payout = pending_payout - NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.affiliate_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_affiliate_earnings
  AFTER INSERT OR UPDATE OF status
  ON tiq_affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_earnings();

-- ============================================
-- PART 5: TELEMETRY & METRICS
-- ============================================

-- Get human economy metrics
CREATE OR REPLACE FUNCTION get_human_economy_metrics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_subscriptions BIGINT,
  active_subscriptions BIGINT,
  subscriptions_by_plan JSONB,
  total_affiliates BIGINT,
  active_affiliates BIGINT,
  total_referrals BIGINT,
  active_referrals BIGINT,
  total_earnings NUMERIC,
  total_paid_out NUMERIC,
  pending_payouts NUMERIC,
  mrr NUMERIC,
  arr NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active
    FROM tiq_users
  ),
  subscription_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      jsonb_object_agg(
        p.plan_code,
        sub_counts.count
      ) as by_plan,
      SUM(
        CASE 
          WHEN s.status = 'active' AND s.billing_period = 'monthly' THEN s.amount
          WHEN s.status = 'active' AND s.billing_period = 'yearly' THEN s.amount / 12
          ELSE 0
        END
      ) as monthly_recurring
    FROM tiq_subscriptions s
    LEFT JOIN tiq_plans p ON s.plan_id = p.id
    LEFT JOIN LATERAL (
      SELECT p.plan_code, COUNT(*) as count
      FROM tiq_subscriptions s2
      WHERE s2.plan_id = p.id AND s2.status = 'active'
      GROUP BY p.plan_code
    ) sub_counts ON true
  ),
  affiliate_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      SUM(total_earnings) as earnings,
      SUM(total_paid_out) as paid,
      SUM(pending_payout) as pending
    FROM tiq_affiliates
  ),
  referral_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active
    FROM tiq_referrals
  )
  SELECT 
    u.total,
    u.active,
    s.total,
    s.active,
    s.by_plan,
    a.total,
    a.active,
    r.total,
    r.active,
    COALESCE(a.earnings, 0),
    COALESCE(a.paid, 0),
    COALESCE(a.pending, 0),
    COALESCE(s.monthly_recurring, 0),
    COALESCE(s.monthly_recurring * 12, 0)
  FROM user_stats u
  CROSS JOIN subscription_stats s
  CROSS JOIN affiliate_stats a
  CROSS JOIN referral_stats r;
END;
$$;

-- ============================================
-- PART 6: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tiq_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiq_affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Public read for plans (anyone can view available plans)
CREATE POLICY tiq_plans_public_read ON tiq_plans
  FOR SELECT USING (is_active = true);

-- Users can read their own data
CREATE POLICY tiq_users_own_read ON tiq_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY tiq_users_own_update ON tiq_users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Users can read their own subscriptions
CREATE POLICY tiq_subscriptions_own_read ON tiq_subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM tiq_users WHERE auth_user_id = auth.uid())
    OR
    organization_id IN (
      SELECT organization_id FROM tiq_organization_members
      WHERE user_id IN (SELECT id FROM tiq_users WHERE auth_user_id = auth.uid())
    )
  );

-- Users can read their affiliate data
CREATE POLICY tiq_affiliates_own_read ON tiq_affiliates
  FOR SELECT USING (
    user_id IN (SELECT id FROM tiq_users WHERE auth_user_id = auth.uid())
  );

-- Users can read their referrals
CREATE POLICY tiq_referrals_own_read ON tiq_referrals
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM tiq_affiliates
      WHERE user_id IN (SELECT id FROM tiq_users WHERE auth_user_id = auth.uid())
    )
  );

-- Users can read their payouts
CREATE POLICY tiq_payouts_own_read ON tiq_affiliate_payouts
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM tiq_affiliates
      WHERE user_id IN (SELECT id FROM tiq_users WHERE auth_user_id = auth.uid())
    )
  );

-- Users can read their commissions
CREATE POLICY tiq_commissions_own_read ON tiq_affiliate_commissions
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM tiq_affiliates
      WHERE user_id IN (SELECT id FROM tiq_users WHERE auth_user_id = auth.uid())
    )
  );

-- ============================================
-- PART 7: SEED DATA (PLANS)
-- ============================================

INSERT INTO tiq_plans (plan_code, plan_name, description, price_monthly, price_yearly, features, limits, is_featured)
VALUES
  (
    'basic',
    'Basic',
    'Perfect for individuals getting started with TiQology',
    9.99,
    99.99,
    '["AI Chat Access", "100 messages/month", "1 Agent", "Community Support"]'::jsonb,
    '{"messages": 100, "agents": 1, "storage_gb": 10, "api_calls": 1000}'::jsonb,
    false
  ),
  (
    'pro',
    'Pro',
    'For professionals who need more power and flexibility',
    29.99,
    299.99,
    '["Unlimited AI Chat", "Unlimited messages", "5 Agents", "Priority Support", "Voice Interface", "Advanced Analytics"]'::jsonb,
    '{"messages": -1, "agents": 5, "storage_gb": 100, "api_calls": 50000}'::jsonb,
    true
  ),
  (
    'elite',
    'Elite',
    'For power users and small teams',
    99.99,
    999.99,
    '["Everything in Pro", "20 Agents", "Team Collaboration", "Custom Integrations", "24/7 Premium Support", "API Access"]'::jsonb,
    '{"messages": -1, "agents": 20, "storage_gb": 500, "api_calls": 500000, "team_members": 5}'::jsonb,
    true
  ),
  (
    'enterprise',
    'Enterprise',
    'Custom solutions for large organizations',
    NULL, -- Custom pricing
    NULL,
    '["Everything in Elite", "Unlimited Agents", "Dedicated Account Manager", "Custom SLA", "On-Premise Deployment", "White Label Options"]'::jsonb,
    '{"messages": -1, "agents": -1, "storage_gb": -1, "api_calls": -1, "team_members": -1}'::jsonb,
    false
  )
ON CONFLICT (plan_code) DO NOTHING;

-- ============================================
-- PART 8: COMMENTS
-- ============================================

COMMENT ON TABLE tiq_users IS 'Core user identity and profile information';
COMMENT ON TABLE tiq_organizations IS 'Organizations/teams that can have multiple members';
COMMENT ON TABLE tiq_plans IS 'Subscription plans available for purchase';
COMMENT ON TABLE tiq_subscriptions IS 'Active and historical subscriptions';
COMMENT ON TABLE tiq_affiliates IS 'Affiliate partners who refer new users';
COMMENT ON TABLE tiq_referrals IS 'Tracking of referred users and their subscriptions';
COMMENT ON TABLE tiq_affiliate_payouts IS 'Payout records for affiliates';
COMMENT ON TABLE tiq_affiliate_commissions IS 'Individual commission transactions';

COMMENT ON FUNCTION generate_affiliate_code IS 'Generates unique affiliate codes like CK1, EK2, DK3';
COMMENT ON FUNCTION get_human_economy_metrics IS 'Returns comprehensive metrics about the human economy system';
