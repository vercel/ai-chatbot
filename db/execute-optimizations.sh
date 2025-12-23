#!/bin/bash
# TiQology: Database Optimization Executor
# Applies all database optimizations to Supabase

set -e

echo "🚀 TiQology Database Optimization Script"
echo "========================================="

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo ""
  echo "Set your Supabase connection string:"
  echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
  exit 1
fi

# Check for psql
if ! command -v psql &> /dev/null; then
  echo "❌ ERROR: psql not installed"
  echo ""
  echo "Install PostgreSQL client:"
  echo "  Ubuntu/Debian: apt install postgresql-client"
  echo "  macOS: brew install postgresql"
  exit 1
fi

echo ""
echo "📊 Step 1: Applying indexes and RLS policies..."
psql "$DATABASE_URL" -f db/migrations/001_tiqology_optimizations.sql

if [ $? -eq 0 ]; then
  echo "✅ Indexes and RLS applied successfully"
else
  echo "❌ Migration failed"
  exit 1
fi

echo ""
echo "🔍 Step 2: Verifying optimizations..."
psql "$DATABASE_URL" -f db/migrations/002_verify_optimizations.sql -o db/verification_results.txt

echo "✅ Verification complete (saved to db/verification_results.txt)"

echo ""
echo "🔧 Step 3: Configuring auto-maintenance..."
psql "$DATABASE_URL" -f db/migrations/003_auto_maintenance.sql

if [ $? -eq 0 ]; then
  echo "✅ Auto-maintenance configured"
else
  echo "⚠️  Auto-maintenance may require elevated permissions"
fi

echo ""
echo "✨ Database optimizations complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review verification results: cat db/verification_results.txt"
echo "2. Configure connection pooling in Supabase Dashboard"
echo "3. Monitor query performance with pg_stat_statements"
echo ""
