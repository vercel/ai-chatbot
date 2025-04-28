#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Define the path to the .npmrc file relative to the command execution directory
# Vercel runs build commands from the root, but let's be safe.
NPMRC_PATH=".npmrc"

# Create or overwrite the .npmrc file
echo "Creating/Overwriting $NPMRC_PATH for Vercel build..."

# Add the Tiptap Pro registry configuration
echo "@tiptap-pro:registry=https://registry.tiptap.dev/" > "$NPMRC_PATH"
echo "Added Tiptap Pro registry config."

# Add the auth token line, directly substituting the environment variable
# Check if the token env var exists
if [[ -z "${TIPTAP_PRO_TOKEN}" ]]; then
  echo "🛑 Error: TIPTAP_PRO_TOKEN environment variable is not set."
  exit 0 # Exit with 0 to prevent potentially exposing logs/errors if token is missing
else
  echo "//registry.tiptap.dev/:_authToken=${TIPTAP_PRO_TOKEN}" >> "$NPMRC_PATH"
  echo "Added Tiptap Pro auth token from environment variable."
fi

# Add setting recommended by pnpm docs for Vercel/serverless environments
# Might help prevent certain deployment issues, though not directly related to auth.
echo "public-hoist-pattern[]=*pnpm*" >> "$NPMRC_PATH"
echo "Added public-hoist-pattern for pnpm."


echo "✅ .npmrc file configured successfully."

# Exit with 1 to signal Vercel to proceed with the build using the standard build command.
exit 1 