#!/bin/bash
# Wrapper script to run Biome from project root
# Usage: run-biome.sh [biome-args...] [files...]

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT" || exit 1

# Run biome with all arguments using npx (more reliable than pnpm exec)
npx @biomejs/biome check --write --no-errors-on-unmatched "$@"
