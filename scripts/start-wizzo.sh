#!/bin/bash

# Startup script for WIZZO project
# This script sets up all necessary components and starts the development server

echo "===== WIZZO Project Startup Script ====="
echo "This script will set up your local environment and start the development server."
echo

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed."
    echo "Please install pnpm before running this script:"
    echo "npm install -g pnpm"
    exit 1
fi

# Create local storage directories
echo "Step 1: Setting up local storage directories..."
pnpm setup:local
echo

# Fix database schema issues
echo "Step 2: Fixing database schema issues..."
pnpm fix:database
echo

# Fix knowledge base tables specifically
echo "Step 3: Setting up knowledge base tables..."
pnpm fix:knowledge
echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Step 4: Installing dependencies..."
    pnpm install
    echo
else
    echo "Step 4: Dependencies already installed, skipping."
    echo
fi

# Start the development server
echo "Step 5: Starting development server..."
echo "The server will start now. Press Ctrl+C to stop."
echo
pnpm dev
