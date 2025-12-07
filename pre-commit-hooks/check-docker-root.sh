#!/bin/sh

# Get the Dockerfile path from command line argument, or default to root Dockerfile
# Pre-commit will pass the filename when pass_filenames: true
if [ $# -gt 0 ]; then
  DOCKERFILE_PATH="$1"
else
  # Fallback to root Dockerfile if no argument provided
  DOCKERFILE_PATH="Dockerfile"
fi

# Check if the Dockerfile exists
if [ ! -f "$DOCKERFILE_PATH" ]; then
  echo "Warning: Dockerfile not found at $DOCKERFILE_PATH. Skipping root user check."
  exit 0
fi

echo "Inspecting $DOCKERFILE_PATH for root user configuration..."

# 1. Check for explicit 'USER root' (case-insensitive)
if grep -iqE "^USER\s+root(\s|$)" "$DOCKERFILE_PATH"; then
  echo "--------------------------------------------------------"
  echo "ERROR: Explicit 'USER root' found in $DOCKERFILE_PATH."
  echo "Containers should run as a non-root user for security."
  echo "Commit aborted."
  echo "--------------------------------------------------------"
  exit 1
fi

# 2. Check if a 'USER' instruction is present at all
# If no USER instruction is present, Docker defaults to the root user (UID 0)
if ! grep -iqE "^USER\s+" "$DOCKERFILE_PATH"; then
  echo "--------------------------------------------------------"
  echo "ERROR: No 'USER' instruction found in $DOCKERFILE_PATH."
  echo "By default, this means the container runs as the root user."
  echo "Please add a 'USER' instruction to specify a non-root user."
  echo "Commit aborted."
  echo "--------------------------------------------------------"
  exit 1
fi

# If both checks pass, a non-root user is likely defined
echo "Check passed: A non-root USER instruction is present."
exit 0
