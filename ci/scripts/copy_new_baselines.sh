#!/bin/bash
# Copy new baseline EXPLAIN JSONs from current/ to baselines if not already present
set -e
mkdir -p ci/explains
for f in ci/explains/current/*.json; do
  base=$(basename "$f")
  if [ ! -f "ci/explains/$base" ]; then
    cp "$f" "ci/explains/$base"
    echo "Copied $f to ci/explains/$base"
  fi
done
