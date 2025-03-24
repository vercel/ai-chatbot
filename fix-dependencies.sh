#!/bin/bash

# Fix dependencies script for Wizzo Vercel project

echo "Fixing dependencies for PDF parsing implementation..."

# Install/reinstall missing dependencies
echo "Reinstalling dependencies..."
npm install

# Specific dependency for Next.js CSS optimization
echo "Ensuring critters is installed..."
npm install critters

# Run PDF parse installation script
echo "Running PDF parse installation script..."
npm run install-pdf-parse

# Clean up Next.js cache
echo "Cleaning Next.js cache..."
rm -rf .next

# Restart the development server when done
echo "Dependencies fixed. Please restart your development server."
echo "Run: npm run dev"
