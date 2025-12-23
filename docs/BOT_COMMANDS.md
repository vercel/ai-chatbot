# 🎯 Bot Commands for Supabase & Spark

## 🗄️ **Supabase Bot Commands**

### 1. Feature Flags Tables
```sql
Create feature_flags and feature_flag_events tables as defined in db/migrations/feature_flags_schema.sql with indexes for name/environment and user lookups, plus get_ab_test_results function for A/B testing analytics
```

### 2. Observability Metrics Table
```sql
Create metrics_history table with columns: timestamp, requests_per_minute, active_users, response_time_ms, error_rate, cpu_usage, memory_usage, cost_per_hour for ML training data collection
```

### 3. Audit Logs Enhancement
```sql
Create immutable audit_logs table with compliance_framework, event_type, actor, findings JSON, archived_to_glacier boolean, and retention_years defaulting to 7 years
```

### 4. Real-Time Metrics View
```sql
Create materialized view real_time_metrics_summary aggregating last 5 minutes of data with auto-refresh every 10 seconds for dashboard queries
```

### 5. Cost Tracking Table
```sql
Create infrastructure_costs table tracking hourly costs by service (vercel, supabase, openai, cloudflare, aws), with daily/weekly rollup views for forecasting
```

---

## ⚡ **Spark AI Agent Commands**

### 1. Auto-Generate Missing Workflows
```
Scan .github/workflows/ directory and create missing advanced workflows: zero-trust-security.yml, service-mesh-deployment.yml, synthetic-monitoring.yml, cross-cloud-backup.yml with production-ready configurations
```

### 2. Optimize All TypeScript Files
```
Review and optimize all .ts files in lib/ and scripts/ for performance: add proper error handling, implement caching where beneficial, add comprehensive JSDoc comments, ensure type safety
```

### 3. Create Integration Tests
```
Generate comprehensive integration test suite in tests/integration/ covering: API endpoints, database operations, feature flags, AI completions, edge functions with 80%+ coverage
```

### 4. Build DevOps Dashboard UI
```
Create React dashboard in public/elite-devops-dashboard/ with real-time metrics from Prometheus, deployment status, feature flag controls, A/B test results, cost charts using recharts library
```

### 5. Generate API Documentation
```
Scan app/api/ directory and auto-generate OpenAPI 3.0 documentation with request/response schemas, authentication requirements, rate limits, example requests in docs/api-reference.md
```

---

## 🎨 **Quick Copy-Paste Commands** (For Immediate Use)

**For Supabase:**
```
Create feature flags infrastructure: feature_flags table with rollout_percentage, environment, conditions, variants, plus feature_flag_events for analytics and get_ab_test_results function
```

**For Spark:**
```
Create production-grade integration tests covering API routes, database operations, and feature flags with 80%+ coverage in tests/integration/ directory
```

---

## 🚀 **Priority Order**

1. **Supabase First**: Feature flags tables (enables A/B testing)
2. **Spark Second**: Integration tests (ensures quality)
3. **Supabase Third**: Metrics tables (enables ML)
4. **Spark Fourth**: Optimize TypeScript files (improves performance)
5. **Spark Fifth**: Build DevOps dashboard (visibility)

---

**Pro Tip**: These commands are optimized for immediate execution. Copy exactly as written for best results!
