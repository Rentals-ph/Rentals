#!/bin/bash

# Storage Cleanup Script for Rental.ph
# This script helps free up space by removing regenerable files

echo "=== Storage Cleanup Script ==="
echo ""
echo "Current directory size:"
du -sh . 2>/dev/null
echo ""

# 1. Remove .next directory (Next.js build cache - regenerated on build)
if [ -d ".next" ]; then
    echo "Removing .next directory (Next.js build cache)..."
    rm -rf .next
    echo "✓ Removed .next directory (~951MB freed)"
else
    echo "✓ .next directory not found (already cleaned)"
fi

# 2. Remove node_modules (can be regenerated with npm install)
read -p "Remove node_modules? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "node_modules" ]; then
        echo "Removing node_modules..."
        rm -rf node_modules
        echo "✓ Removed node_modules (~511MB freed)"
    else
        echo "✓ node_modules not found"
    fi
fi

# 3. Remove backend/vendor (can be regenerated with composer install)
read -p "Remove backend/vendor? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "backend/vendor" ]; then
        echo "Removing backend/vendor..."
        rm -rf backend/vendor
        echo "✓ Removed backend/vendor (~84MB freed)"
    else
        echo "✓ backend/vendor not found"
    fi
fi

# 4. Clean backend storage logs (optional)
read -p "Clean backend/storage/logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "backend/storage/logs" ]; then
        echo "Cleaning backend/storage/logs..."
        find backend/storage/logs -name "*.log" -type f -delete
        echo "✓ Cleaned backend/storage/logs (~12MB freed)"
    else
        echo "✓ backend/storage/logs not found"
    fi
fi

# 5. Clean .vite cache
if [ -d ".vite" ]; then
    echo "Removing .vite cache..."
    rm -rf .vite
    echo "✓ Removed .vite cache (~3.8MB freed)"
fi

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "New directory size:"
du -sh . 2>/dev/null
echo ""
echo "Note: To free up the remaining ~2GB from .git history, you'll need to:"
echo "  1. Use git-filter-repo or BFG Repo-Cleaner to remove large files from history"
echo "  2. Or consider starting fresh with a new git repository"
echo ""
echo "To regenerate removed files:"
echo "  - npm install (for node_modules)"
echo "  - npm run build (for .next)"
echo "  - cd backend && composer install (for vendor)"

