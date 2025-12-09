-- ============================================
-- HUMAN ECONOMY TELEMETRY & ANALYTICS
-- Migration 005: Advanced metrics and dashboard functions
-- ============================================

-- ============================================
-- FUNCTION: Get Real-Time Economy Metrics
-- ============================================
CREATE OR REPLACE FUNCTION get_economy_realtime_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metrics jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'users', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active_last_7_days', COUNT(*) FILTER (WHERE last_seen_at > now() - interval '7 days'),
        'active_last_30_days', COUNT(*) FILTER (WHERE last_seen_at > now() - interval '30 days'),
        'by_role', jsonb_object_agg(
          role,
          COUNT(*)
        )
      )
      FROM tiq_users
      WHERE status = 'active'
    ),
    'subscriptions', (
      SELECT jsonb_build_object(
        'total_active', COUNT(*),
        'total_revenue_monthly', SUM(amount) FILTER (WHERE billing_period = 'monthly'),
        'total_revenue_yearly', SUM(amount) FILTER (WHERE billing_period = 'yearly'),
        'mrr', SUM(CASE 
          WHEN billing_period = 'monthly' THEN amount
          WHEN billing_period = 'yearly' THEN amount / 12
          ELSE 0
        END),
        'by_plan', (
          SELECT jsonb_object_agg(
            p.plan_name,
            COUNT(s.*)
          )
          FROM tiq_subscriptions s
          JOIN tiq_plans p ON s.plan_id = p.id
          WHERE s.status = 'active'
          GROUP BY p.plan_name
        ),
        'in_trial', COUNT(*) FILTER (WHERE trial_ends_at > now()),
        'churn_risk', COUNT(*) FILTER (WHERE cancel_at_period_end = true)
      )
      FROM tiq_subscriptions
      WHERE status = 'active'
    ),
    'affiliates', (
      SELECT jsonb_build_object(
        'total_affiliates', COUNT(DISTINCT a.id),
        'active_affiliates', COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active'),
        'total_referrals', SUM(a.total_referrals),
        'active_referrals', SUM(a.active_referrals),
        'total_earnings', SUM(a.total_earnings),
        'total_payouts', SUM(a.total_payouts),
        'pending_earnings', SUM(a.pending_earnings)
      )
      FROM tiq_affiliates a
    ),
    'commissions', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'paid', COUNT(*) FILTER (WHERE status = 'paid'),
        'pending_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
        'approved_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0),
        'paid_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)
      )
      FROM tiq_affiliate_commissions
    ),
    'payouts', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'processing', COUNT(*) FILTER (WHERE status = 'processing'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_amount', COALESCE(SUM(amount), 0),
        'completed_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)
      )
      FROM tiq_affiliate_payouts
    )
  ) INTO metrics;

  RETURN metrics;
END;
$$;

-- ============================================
-- FUNCTION: Get User Financial Profile
-- ============================================
CREATE OR REPLACE FUNCTION get_user_financial_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', u.id,
    'handle', u.handle,
    'display_name', u.display_name,
    'role', u.role,
    'is_affiliate', u.is_affiliate,
    'affiliate_code', u.affiliate_code,
    'subscription', (
      SELECT jsonb_build_object(
        'id', s.id,
        'plan', p.plan_name,
        'status', s.status,
        'billing_period', s.billing_period,
        'amount', s.amount,
        'currency', s.currency,
        'trial_ends_at', s.trial_ends_at,
        'current_period_end', s.current_period_end,
        'cancel_at_period_end', s.cancel_at_period_end
      )
      FROM tiq_subscriptions s
      JOIN tiq_plans p ON s.plan_id = p.id
      WHERE s.user_id = u.id
        AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    'affiliate_stats', (
      SELECT jsonb_build_object(
        'affiliate_id', a.id,
        'affiliate_code', a.affiliate_code,
        'total_referrals', a.total_referrals,
        'active_referrals', a.active_referrals,
        'total_earnings', a.total_earnings,
        'pending_earnings', a.pending_earnings,
        'total_payouts', a.total_payouts,
        'status', a.status
      )
      FROM tiq_affiliates a
      WHERE a.user_id = u.id
    ),
    'referral_info', (
      SELECT jsonb_build_object(
        'referred_by_code', u.referred_by_code,
        'referral_status', r.status,
        'referral_created_at', r.created_at
      )
      FROM tiq_referrals r
      WHERE r.referred_user_id = u.id
      LIMIT 1
    ),
    'lifetime_value', (
      SELECT COALESCE(SUM(se.amount), 0)
      FROM tiq_subscription_events se
      JOIN tiq_subscriptions s ON se.subscription_id = s.id
      WHERE s.user_id = u.id
        AND se.event_type IN ('payment_succeeded', 'created')
    )
  ) INTO profile
  FROM tiq_users u
  WHERE u.id = p_user_id;

  RETURN profile;
END;
$$;

-- ============================================
-- FUNCTION: Get Affiliate Performance Report
-- ============================================
CREATE OR REPLACE FUNCTION get_affiliate_performance_report(
  p_affiliate_id uuid,
  p_period_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report jsonb;
  period_start timestamp;
BEGIN
  period_start := now() - (p_period_days || ' days')::interval;

  SELECT jsonb_build_object(
    'affiliate_id', a.id,
    'affiliate_code', a.affiliate_code,
    'user', jsonb_build_object(
      'id', u.id,
      'handle', u.handle,
      'display_name', u.display_name
    ),
    'period', jsonb_build_object(
      'start_date', period_start,
      'end_date', now(),
      'days', p_period_days
    ),
    'summary', jsonb_build_object(
      'total_referrals', a.total_referrals,
      'active_referrals', a.active_referrals,
      'total_earnings', a.total_earnings,
      'pending_earnings', a.pending_earnings,
      'total_payouts', a.total_payouts
    ),
    'period_stats', jsonb_build_object(
      'new_referrals', (
        SELECT COUNT(*)
        FROM tiq_referrals r
        WHERE r.affiliate_id = a.id
          AND r.created_at >= period_start
      ),
      'referrals_converted', (
        SELECT COUNT(*)
        FROM tiq_referrals r
        WHERE r.affiliate_id = a.id
          AND r.first_payment_at >= period_start
      ),
      'commissions_earned', (
        SELECT COALESCE(SUM(c.amount), 0)
        FROM tiq_affiliate_commissions c
        WHERE c.affiliate_id = a.id
          AND c.created_at >= period_start
      ),
      'payouts_received', (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM tiq_affiliate_payouts p
        WHERE p.affiliate_id = a.id
          AND p.status = 'completed'
          AND p.completed_at >= period_start
      )
    ),
    'commission_breakdown', (
      SELECT jsonb_object_agg(
        commission_type,
        jsonb_build_object(
          'count', count,
          'total_amount', total_amount
        )
      )
      FROM (
        SELECT
          c.commission_type,
          COUNT(*) as count,
          SUM(c.amount) as total_amount
        FROM tiq_affiliate_commissions c
        WHERE c.affiliate_id = a.id
          AND c.created_at >= period_start
        GROUP BY c.commission_type
      ) commission_data
    ),
    'top_referrals', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'referred_user_id', r.referred_user_id,
          'referred_user_handle', u2.handle,
          'status', r.status,
          'total_commission_earned', r.total_commission_earned,
          'created_at', r.created_at,
          'first_payment_at', r.first_payment_at
        )
      )
      FROM (
        SELECT *
        FROM tiq_referrals
        WHERE affiliate_id = a.id
        ORDER BY total_commission_earned DESC
        LIMIT 10
      ) r
      JOIN tiq_users u2 ON r.referred_user_id = u2.id
    )
  ) INTO report
  FROM tiq_affiliates a
  JOIN tiq_users u ON a.user_id = u.id
  WHERE a.id = p_affiliate_id;

  RETURN report;
END;
$$;

-- ============================================
-- FUNCTION: Get Subscription Analytics
-- ============================================
CREATE OR REPLACE FUNCTION get_subscription_analytics(p_period_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics jsonb;
  period_start timestamp;
BEGIN
  period_start := now() - (p_period_days || ' days')::interval;

  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', period_start,
      'end_date', now(),
      'days', p_period_days
    ),
    'overview', jsonb_build_object(
      'total_active_subscriptions', (
        SELECT COUNT(*)
        FROM tiq_subscriptions
        WHERE status = 'active'
      ),
      'mrr', (
        SELECT SUM(CASE 
          WHEN billing_period = 'monthly' THEN amount
          WHEN billing_period = 'yearly' THEN amount / 12
          ELSE 0
        END)
        FROM tiq_subscriptions
        WHERE status = 'active'
      ),
      'arr', (
        SELECT SUM(CASE 
          WHEN billing_period = 'monthly' THEN amount * 12
          WHEN billing_period = 'yearly' THEN amount
          ELSE 0
        END)
        FROM tiq_subscriptions
        WHERE status = 'active'
      )
    ),
    'period_activity', jsonb_build_object(
      'new_subscriptions', (
        SELECT COUNT(*)
        FROM tiq_subscriptions
        WHERE created_at >= period_start
      ),
      'cancellations', (
        SELECT COUNT(*)
        FROM tiq_subscriptions
        WHERE canceled_at >= period_start
      ),
      'churn_rate', (
        SELECT CASE 
          WHEN COUNT(*) FILTER (WHERE created_at < period_start) > 0 
          THEN (COUNT(*) FILTER (WHERE canceled_at >= period_start)::float / 
                COUNT(*) FILTER (WHERE created_at < period_start)::float) * 100
          ELSE 0
        END
        FROM tiq_subscriptions
      ),
      'upgrades', (
        SELECT COUNT(*)
        FROM tiq_subscription_events
        WHERE event_type = 'plan_changed'
          AND created_at >= period_start
      )
    ),
    'by_plan', (
      SELECT jsonb_object_agg(
        p.plan_name,
        jsonb_build_object(
          'active_count', COUNT(s.*),
          'mrr', SUM(CASE 
            WHEN s.billing_period = 'monthly' THEN s.amount
            WHEN s.billing_period = 'yearly' THEN s.amount / 12
            ELSE 0
          END)
        )
      )
      FROM tiq_subscriptions s
      JOIN tiq_plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
      GROUP BY p.plan_name
    ),
    'by_billing_period', (
      SELECT jsonb_object_agg(
        billing_period,
        jsonb_build_object(
          'count', count,
          'total_revenue', total_revenue
        )
      )
      FROM (
        SELECT
          billing_period,
          COUNT(*) as count,
          SUM(amount) as total_revenue
        FROM tiq_subscriptions
        WHERE status = 'active'
        GROUP BY billing_period
      ) billing_data
    )
  ) INTO analytics;

  RETURN analytics;
END;
$$;

-- ============================================
-- FUNCTION: Track Subscription Event (Enhanced)
-- ============================================
CREATE OR REPLACE FUNCTION track_subscription_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log to subscription events
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO tiq_subscription_events (
      subscription_id,
      event_type,
      new_status,
      amount,
      currency
    ) VALUES (
      NEW.id,
      'created',
      NEW.status,
      NEW.amount,
      NEW.currency
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      INSERT INTO tiq_subscription_events (
        subscription_id,
        event_type,
        previous_status,
        new_status,
        amount,
        currency
      ) VALUES (
        NEW.id,
        'status_changed',
        OLD.status,
        NEW.status,
        NEW.amount,
        NEW.currency
      );
    END IF;

    -- Plan changed
    IF (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
      INSERT INTO tiq_subscription_events (
        subscription_id,
        event_type,
        previous_status,
        new_status,
        amount,
        currency,
        metadata
      ) VALUES (
        NEW.id,
        'plan_changed',
        OLD.status,
        NEW.status,
        NEW.amount,
        NEW.currency,
        jsonb_build_object(
          'old_plan_id', OLD.plan_id,
          'new_plan_id', NEW.plan_id,
          'old_amount', OLD.amount,
          'new_amount', NEW.amount
        )
      );
    END IF;
  END IF;

  -- Log to AgentOS
  INSERT INTO agentos_event_log (
    event_type,
    agent_id,
    status,
    metadata
  ) VALUES (
    'subscription_' || LOWER(TG_OP),
    'human-economy',
    'completed',
    row_to_json(NEW)::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger for subscription events
DROP TRIGGER IF EXISTS track_subscription_events_trigger ON tiq_subscriptions;
CREATE TRIGGER track_subscription_events_trigger
  AFTER INSERT OR UPDATE ON tiq_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION track_subscription_event();

-- ============================================
-- FUNCTION: Calculate LTV (Lifetime Value)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_user_ltv(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  ltv numeric;
BEGIN
  SELECT COALESCE(SUM(se.amount), 0)
  INTO ltv
  FROM tiq_subscription_events se
  JOIN tiq_subscriptions s ON se.subscription_id = s.id
  WHERE s.user_id = p_user_id
    AND se.event_type IN ('payment_succeeded', 'created');

  RETURN ltv;
END;
$$;

-- ============================================
-- INDEXES FOR ANALYTICS PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at 
  ON tiq_subscription_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type 
  ON tiq_subscription_events(event_type);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_created 
  ON tiq_subscriptions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_at 
  ON tiq_subscriptions(canceled_at) WHERE canceled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_created_at 
  ON tiq_affiliate_commissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commissions_status 
  ON tiq_affiliate_commissions(status);

CREATE INDEX IF NOT EXISTS idx_referrals_created_at 
  ON tiq_referrals(created_at DESC);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_economy_realtime_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_financial_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_affiliate_performance_report(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_analytics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_ltv(uuid) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_economy_realtime_metrics() IS 
  'Returns real-time metrics for the entire Human Economy system including users, subscriptions, affiliates, and payouts';

COMMENT ON FUNCTION get_user_financial_profile(uuid) IS 
  'Returns comprehensive financial profile for a specific user including subscription, affiliate stats, and LTV';

COMMENT ON FUNCTION get_affiliate_performance_report(uuid, integer) IS 
  'Returns detailed performance report for an affiliate over a specified period';

COMMENT ON FUNCTION get_subscription_analytics(integer) IS 
  'Returns subscription analytics including MRR, ARR, churn rate, and plan distribution';

COMMENT ON FUNCTION calculate_user_ltv(uuid) IS 
  'Calculates lifetime value for a specific user based on all payments';
