# TiQology Core Database Schema

**Database:** Supabase (PostgreSQL)  
**Version:** 1.0  
**Last Updated:** December 6, 2025

---

## Overview

This is the complete database schema for TiQology's global data fabric. All tables use Row Level Security (RLS) for multi-tenant data isolation.

---

## 1. Users & Authentication

### `users`
Core user account table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  password_hash VARCHAR(255), -- NULL for OAuth users
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### `accounts`
OAuth provider accounts (Google, GitHub, etc.)

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', 'apple'
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider);
```

### `sessions`
Active user sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### `affiliate_codes`
Referral/affiliate system

```sql
CREATE TABLE affiliate_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Percentage
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_affiliate_codes_code ON affiliate_codes(code);
CREATE INDEX idx_affiliate_codes_owner ON affiliate_codes(owner_user_id);
```

---

## 2. Products & Commerce

### `products`
All TiQology products/modules

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'module', 'subscription', 'digital-good', 'service'
  module_type VARCHAR(100), -- 'earn-hub', 'fan-ops', 'build-lab', etc.
  price_usd DECIMAL(10,2) NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  billing_interval VARCHAR(50), -- 'monthly', 'yearly', NULL
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_module_type ON products(module_type);
CREATE INDEX idx_products_is_active ON products(is_active);
```

### `subscriptions`
User subscriptions to recurring products

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'expired'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

### `product_purchases`
One-time product purchases

```sql
CREATE TABLE product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  affiliate_code_id UUID REFERENCES affiliate_codes(id),
  amount_usd DECIMAL(10,2) NOT NULL,
  commission_paid_usd DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) NOT NULL, -- 'completed', 'pending', 'refunded', 'failed'
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'credit'
  stripe_payment_intent_id VARCHAR(255),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_purchases_user_id ON product_purchases(user_id);
CREATE INDEX idx_purchases_product_id ON product_purchases(product_id);
CREATE INDEX idx_purchases_affiliate_code ON product_purchases(affiliate_code_id);
CREATE INDEX idx_purchases_status ON product_purchases(status);
```

---

## 3. Legal Intelligence

### `legal_evaluations`
Ghost API evaluations (general)

```sql
CREATE TABLE legal_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID, -- Organization ID (if applicable)
  case_id VARCHAR(255), -- User's case reference
  evaluation_type VARCHAR(100) NOT NULL, -- 'ghost', 'best_interest', etc.
  prompt TEXT NOT NULL,
  context TEXT,
  model_used VARCHAR(100), -- 'claude-sonnet', 'claude-haiku', etc.
  score INTEGER, -- 0-100
  feedback TEXT,
  reasoning TEXT, -- For deep reasoning models
  confidence DECIMAL(5,2), -- 0-100
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_legal_evals_user_id ON legal_evaluations(user_id);
CREATE INDEX idx_legal_evals_org_id ON legal_evaluations(org_id);
CREATE INDEX idx_legal_evals_case_id ON legal_evaluations(case_id);
CREATE INDEX idx_legal_evals_type ON legal_evaluations(evaluation_type);
CREATE INDEX idx_legal_evals_created_at ON legal_evaluations(created_at DESC);
```

### `best_interest_records`
Best Interest of the Child evaluations

```sql
CREATE TABLE best_interest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID,
  case_id VARCHAR(255),
  evaluation_id UUID REFERENCES legal_evaluations(id),
  parenting_plan TEXT NOT NULL,
  communication TEXT NOT NULL,
  incidents TEXT NOT NULL,
  child_profile TEXT NOT NULL,
  overall_score INTEGER, -- 0-100
  overall_assessment TEXT,
  recommendations TEXT,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_best_interest_user_id ON best_interest_records(user_id);
CREATE INDEX idx_best_interest_case_id ON best_interest_records(case_id);
CREATE INDEX idx_best_interest_eval_id ON best_interest_records(evaluation_id);
```

### `evaluation_dimension_scores`
4-dimensional scores for Best Interest Engine

```sql
CREATE TABLE evaluation_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES legal_evaluations(id) ON DELETE CASCADE,
  dimension_name VARCHAR(100) NOT NULL, -- 'Stability', 'Emotional', 'Safety', 'Development'
  score INTEGER NOT NULL, -- 0-100
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dimension_scores_eval_id ON evaluation_dimension_scores(evaluation_id);
CREATE INDEX idx_dimension_scores_dimension ON evaluation_dimension_scores(dimension_name);
```

---

## 4. AgentOS Event Logging

### `agentos_event_log`
All agent execution events

```sql
CREATE TABLE agentos_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- 'evaluation_run', 'build_task', 'ops_task', etc.
  agent_id VARCHAR(100) NOT NULL, -- 'ghost-evaluator', 'devin-builder', etc.
  task_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  org_id UUID,
  case_id VARCHAR(255),
  evaluation_id UUID REFERENCES legal_evaluations(id),
  status VARCHAR(50) NOT NULL, -- 'started', 'completed', 'failed'
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agentos_event_type ON agentos_event_log(event_type);
CREATE INDEX idx_agentos_agent_id ON agentos_event_log(agent_id);
CREATE INDEX idx_agentos_task_id ON agentos_event_log(task_id);
CREATE INDEX idx_agentos_user_id ON agentos_event_log(user_id);
CREATE INDEX idx_agentos_created_at ON agentos_event_log(created_at DESC);
```

---

## 5. Partners & Vendors

### `partner_companies`
Corporate partners (Uber, hotels, survey vendors, etc.)

```sql
CREATE TABLE partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100), -- 'transportation', 'hospitality', 'surveys', etc.
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  api_endpoint TEXT,
  api_key_encrypted TEXT, -- Encrypted API key
  is_active BOOLEAN DEFAULT true,
  partnership_tier VARCHAR(50), -- 'bronze', 'silver', 'gold', 'platinum'
  commission_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_partners_industry ON partner_companies(industry);
CREATE INDEX idx_partners_is_active ON partner_companies(is_active);
```

### `negotiator_requests`
Bot negotiation history

```sql
CREATE TABLE negotiator_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES partner_companies(id),
  request_type VARCHAR(100) NOT NULL, -- 'discount', 'partnership', 'api_access'
  user_count INTEGER, -- Number of users requesting
  status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected', 'negotiating'
  discount_offered DECIMAL(5,2), -- Percentage
  terms TEXT,
  bot_email_sent BOOLEAN DEFAULT false,
  bot_email_content TEXT,
  response_received TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_negotiator_partner_id ON negotiator_requests(partner_company_id);
CREATE INDEX idx_negotiator_status ON negotiator_requests(status);
CREATE INDEX idx_negotiator_created_at ON negotiator_requests(created_at DESC);
```

### `vendor_deals`
Secured discounts/deals

```sql
CREATE TABLE vendor_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID NOT NULL REFERENCES partner_companies(id),
  negotiator_request_id UUID REFERENCES negotiator_requests(id),
  deal_type VARCHAR(100), -- 'percentage_discount', 'flat_discount', 'free_upgrade'
  discount_value DECIMAL(10,2), -- Percentage or dollar amount
  promo_code VARCHAR(100),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_vendor_deals_partner_id ON vendor_deals(partner_company_id);
CREATE INDEX idx_vendor_deals_promo_code ON vendor_deals(promo_code);
CREATE INDEX idx_vendor_deals_is_active ON vendor_deals(is_active);
```

---

## 6. FanOps (Sports Module)

### `sports_events`
Major sports events (World Cup, Olympics, NFL, etc.)

```sql
CREATE TABLE sports_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sport_type VARCHAR(100), -- 'soccer', 'football', 'basketball', 'olympics'
  event_type VARCHAR(100), -- 'world-cup', 'super-bowl', 'nba-finals', etc.
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location_city VARCHAR(255),
  location_country VARCHAR(100),
  venue_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  api_integration VARCHAR(100), -- 'espn', 'sportradar', etc.
  external_event_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sports_events_sport_type ON sports_events(sport_type);
CREATE INDEX idx_sports_events_start_date ON sports_events(start_date);
CREATE INDEX idx_sports_events_is_active ON sports_events(is_active);
```

### `fan_missions`
QR code challenges and missions

```sql
CREATE TABLE fan_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sports_event_id UUID REFERENCES sports_events(id),
  mission_type VARCHAR(100) NOT NULL, -- 'qr_scan', 'check_in', 'photo', 'trivia'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  qr_code_data TEXT, -- Encrypted QR data
  reward_points INTEGER DEFAULT 0,
  reward_discount_id UUID REFERENCES vendor_deals(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_fan_missions_event_id ON fan_missions(sports_event_id);
CREATE INDEX idx_fan_missions_mission_type ON fan_missions(mission_type);
CREATE INDEX idx_fan_missions_is_active ON fan_missions(is_active);
```

### `user_fan_missions`
User mission completions

```sql
CREATE TABLE user_fan_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fan_mission_id UUID NOT NULL REFERENCES fan_missions(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  verification_data JSONB, -- Photo URL, QR scan timestamp, etc.
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, fan_mission_id)
);

CREATE INDEX idx_user_fan_missions_user_id ON user_fan_missions(user_id);
CREATE INDEX idx_user_fan_missions_mission_id ON user_fan_missions(fan_mission_id);
```

### `travel_counts`
Global discount unlock counter

```sql
CREATE TABLE travel_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sports_event_id UUID REFERENCES sports_events(id),
  destination_city VARCHAR(255),
  destination_country VARCHAR(100),
  travel_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'confirmed', 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_travel_counts_user_id ON travel_counts(user_id);
CREATE INDEX idx_travel_counts_event_id ON travel_counts(sports_event_id);
CREATE INDEX idx_travel_counts_destination ON travel_counts(destination_country);
```

### `rewards`
Fan rewards earned

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(100) NOT NULL, -- 'points', 'discount', 'free_item', 'vip_access'
  source_type VARCHAR(100), -- 'fan_mission', 'purchase', 'referral'
  source_id UUID, -- ID of fan_mission, purchase, etc.
  points_earned INTEGER DEFAULT 0,
  discount_value DECIMAL(10,2),
  description TEXT,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_type ON rewards(reward_type);
CREATE INDEX idx_rewards_is_redeemed ON rewards(is_redeemed);
```

---

## 7. Future Build Lab

### `build_lab_plans`
AI-generated building plans

```sql
CREATE TABLE build_lab_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID REFERENCES users(id),
  architect_id UUID REFERENCES architects(id),
  plan_type VARCHAR(100) NOT NULL, -- 'residential', 'commercial', 'mixed-use'
  style VARCHAR(100), -- 'futuristic', 'modern', 'traditional', 'eco-friendly'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ai_model_used VARCHAR(100), -- 'dall-e-3', 'midjourney', 'stable-diffusion'
  preview_image_url TEXT,
  render_3d_url TEXT, -- 3D walkthrough URL
  cad_file_url TEXT,
  pdf_file_url TEXT,
  price_usd DECIMAL(10,2),
  is_purchasable BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  purchase_count INTEGER DEFAULT 0,
  license_type VARCHAR(50), -- 'personal', 'commercial', 'royalty-free'
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_build_lab_plans_type ON build_lab_plans(plan_type);
CREATE INDEX idx_build_lab_plans_style ON build_lab_plans(style);
CREATE INDEX idx_build_lab_plans_is_featured ON build_lab_plans(is_featured);
```

### `architects`
Partner architects

```sql
CREATE TABLE architects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  firm_name VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  license_number VARCHAR(100),
  license_state VARCHAR(100),
  portfolio_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_architects_user_id ON architects(user_id);
CREATE INDEX idx_architects_is_verified ON architects(is_verified);
```

### `plan_purchases`
Digital plan purchases

```sql
CREATE TABLE plan_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  build_lab_plan_id UUID NOT NULL REFERENCES build_lab_plans(id),
  amount_usd DECIMAL(10,2) NOT NULL,
  commission_paid_usd DECIMAL(10,2) DEFAULT 0.00,
  license_type VARCHAR(50),
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_plan_purchases_user_id ON plan_purchases(user_id);
CREATE INDEX idx_plan_purchases_plan_id ON plan_purchases(build_lab_plan_id);
```

---

## 8. EarnHub (Surveys & Passive Income)

### `survey_vendors`
Survey company integrations

```sql
CREATE TABLE survey_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(100), -- 'survey', 'task', 'watch-ads', 'data-sharing'
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  payout_rate DECIMAL(10,4), -- $ per survey/task
  min_payout_usd DECIMAL(10,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_survey_vendors_vendor_type ON survey_vendors(vendor_type);
CREATE INDEX idx_survey_vendors_is_active ON survey_vendors(is_active);
```

### `user_earnings`
User passive income tracking

```sql
CREATE TABLE user_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  earning_type VARCHAR(100) NOT NULL, -- 'survey', 'task', 'affiliate', 'referral'
  source_vendor_id UUID REFERENCES survey_vendors(id),
  amount_usd DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_user_earnings_user_id ON user_earnings(user_id);
CREATE INDEX idx_user_earnings_status ON user_earnings(status);
CREATE INDEX idx_user_earnings_created_at ON user_earnings(created_at DESC);
```

### `cashout_requests`
Withdrawal requests

```sql
CREATE TABLE cashout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10,2) NOT NULL,
  payout_method VARCHAR(50) NOT NULL, -- 'paypal', 'stripe', 'bank_transfer'
  payout_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_cashout_requests_user_id ON cashout_requests(user_id);
CREATE INDEX idx_cashout_requests_status ON cashout_requests(status);
```

---

## 9. Security / TrustShield

### `security_events`
Security event logging

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL, -- 'login', 'failed_login', 'password_change', 'suspicious_activity'
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(500),
  threat_score INTEGER, -- 0-100
  is_blocked BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_threat_score ON security_events(threat_score);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
```

### `device_fingerprints`
Known devices

```sql
CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint_hash VARCHAR(500) UNIQUE NOT NULL,
  device_name VARCHAR(255),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
```

---

## 10. Analytics Tables

### `user_activity_log`
General user activity tracking

```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- 'page_view', 'feature_use', 'purchase', etc.
  page_path TEXT,
  feature_name VARCHAR(255),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity_log(created_at DESC);
```

---

## 11. Gamification System

### `user_achievements`
User achievements and badges

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL, -- 'first_evaluation', 'power_user', 'streak_7_days'
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  points_earned INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_achievements_type ON user_achievements(achievement_type);
```

### `user_levels`
User experience points and levels

```sql
CREATE TABLE user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX idx_user_levels_total_xp ON user_levels(total_xp DESC);
```

### `leaderboards`
Global and category-specific leaderboards

```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'global', 'fan_ops', 'earn_hub', 'legal'
  score INTEGER NOT NULL,
  rank INTEGER,
  period VARCHAR(50) NOT NULL, -- 'all_time', 'monthly', 'weekly', 'daily'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leaderboards_category ON leaderboards(category);
CREATE INDEX idx_leaderboards_period ON leaderboards(period);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);
```

---

## 12. Social Features

### `user_friends`
Friend connections (bidirectional)

```sql
CREATE TABLE user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  CHECK (user_id != friend_user_id),
  UNIQUE(user_id, friend_user_id)
);

CREATE INDEX idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX idx_user_friends_friend_id ON user_friends(friend_user_id);
CREATE INDEX idx_user_friends_status ON user_friends(status);
```

### `shared_items`
Shared evaluations, plans, reports

```sql
CREATE TABLE shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(100) NOT NULL, -- 'evaluation', 'build_plan', 'report'
  item_id UUID NOT NULL,
  permission_level VARCHAR(50) DEFAULT 'view', -- 'view', 'edit', 'admin'
  share_token VARCHAR(255) UNIQUE, -- For public sharing (no login required)
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_shared_items_owner ON shared_items(owner_user_id);
CREATE INDEX idx_shared_items_recipient ON shared_items(shared_with_user_id);
CREATE INDEX idx_shared_items_token ON shared_items(share_token);
```

### `user_activity_feed`
Social activity feed (like Twitter/Facebook)

```sql
CREATE TABLE user_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- 'achievement_unlocked', 'friend_joined', 'milestone'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link_url TEXT,
  is_public BOOLEAN DEFAULT true,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_activity_feed_user_id ON user_activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON user_activity_feed(created_at DESC);
```

---

## 13. Real-Time Collaboration

### `collaborative_documents`
Real-time collaborative editing sessions

```sql
CREATE TABLE collaborative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(100) NOT NULL, -- 'legal_evaluation', 'build_plan', 'report'
  document_id UUID NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content JSONB, -- Collaborative content (Y.js or similar)
  version INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  locked_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collab_docs_owner ON collaborative_documents(owner_user_id);
CREATE INDEX idx_collab_docs_type ON collaborative_documents(document_type);
```

### `document_collaborators`
Users with access to collaborative documents

```sql
CREATE TABLE document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'editor', -- 'viewer', 'editor', 'admin'
  cursor_position JSONB, -- Real-time cursor position
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_doc_collaborators_doc_id ON document_collaborators(document_id);
CREATE INDEX idx_doc_collaborators_user_id ON document_collaborators(user_id);
```

### `document_comments`
Comments on collaborative documents

```sql
CREATE TABLE document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES document_comments(id), -- For threaded replies
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_by_user_id UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_doc_comments_doc_id ON document_comments(document_id);
CREATE INDEX idx_doc_comments_user_id ON document_comments(user_id);
```

---

## Row Level Security (RLS) Policies

### Example: Users can only see their own data

```sql
-- Enable RLS on all user-scoped tables
ALTER TABLE legal_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;
-- ... etc for all user-scoped tables

-- Users can only see their own evaluations
CREATE POLICY "Users can view own evaluations"
  ON legal_evaluations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own evaluations
CREATE POLICY "Users can insert own evaluations"
  ON legal_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables...
```

---

## Database Functions & Triggers

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repeat for other tables...
```

### Calculate user total earnings

```sql
CREATE OR REPLACE FUNCTION get_user_total_earnings(p_user_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount_usd), 0)
  FROM user_earnings
  WHERE user_id = p_user_id AND status = 'approved';
$$ LANGUAGE sql STABLE;
```

---

## Migration Strategy

1. **Phase 1:** Users, Auth, Sessions (Week 1)
2. **Phase 2:** Products, Purchases, Subscriptions (Week 1-2)
3. **Phase 3:** Legal evaluations + AgentOS logging (Week 2)
4. **Phase 4:** FanOps module tables (Week 3)
5. **Phase 5:** EarnHub module tables (Week 3)
6. **Phase 6:** Future Build Lab tables (Week 4)
7. **Phase 7:** Security tables (Week 4)
8. **Phase 8:** Analytics + optimization (Week 4+)

---

## Backup & Maintenance

- **Automated Backups:** Daily via Supabase (7-day retention)
- **Point-in-Time Recovery:** Enabled
- **Archival Strategy:** Move old evaluations to cold storage after 1 year
- **Index Optimization:** Monthly VACUUM and ANALYZE
- **Monitoring:** pg_stat_statements for slow query detection

---

## Next Steps for Devin

1. ✅ Review this schema with Coach Chat
2. ✅ Create Supabase project (TiQology Core DB)
3. ✅ Run migrations in order (Phase 1 → Phase 8)
4. ✅ Set up RLS policies for all user-scoped tables
5. ✅ Create seed data for testing
6. ✅ Build Supabase client in TiQology-spa
7. ✅ Test CRUD operations for each table
8. ✅ Document API endpoints in separate file

---

**Schema Version:** 1.0  
**Last Updated:** December 6, 2025  
**Maintained By:** Devin (Senior Agent Engineer)
