#!/bin/bash
echo "Running task schema migration..."
npx tsx lib/db/migrate.ts
echo "Migration completed."