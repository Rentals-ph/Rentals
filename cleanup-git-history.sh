#!/bin/bash

# Git History Cleanup Script
# This script removes .next and node_modules from Git history
# WARNING: This rewrites history and requires force push to remote

set -e

echo "=== Git History Cleanup Script ==="
echo ""
echo "This script will:"
echo "  1. Remove .next/ directory from all Git history"
echo "  2. Remove node_modules/ from all Git history (if present)"
echo "  3. Clean up and optimize the repository"
echo ""
echo "WARNING: This rewrites Git history!"
echo "  - All team members will need to re-clone or reset their repos"
echo "  - You'll need to force push to remote"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo ""
    echo "ERROR: git-filter-repo is not installed."
    echo ""
    echo "Install it with one of these methods:"
    echo "  - pip install git-filter-repo"
    echo "  - sudo apt install git-filter-repo  (Debian/Ubuntu)"
    echo "  - brew install git-filter-repo  (macOS)"
    echo ""
    echo "Alternatively, you can use BFG Repo-Cleaner:"
    echo "  - Download from: https://rtyley.github.io/bfg-repo-cleaner/"
    echo ""
    exit 1
fi

echo ""
echo "Step 1: Creating backup branch..."
git branch backup-before-cleanup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
echo "✓ Backup branch created"

echo ""
echo "Step 2: Removing .next/ from Git history..."
git filter-repo --path .next --invert-paths --force

echo ""
echo "Step 3: Removing node_modules/ from Git history (if present)..."
git filter-repo --path node_modules --invert-paths --force 2>/dev/null || echo "  (node_modules not found in history)"

echo ""
echo "Step 4: Cleaning up and optimizing repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Repository size after cleanup:"
git count-objects -vH
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log --all --oneline"
echo "  2. Force push to remote: git push --force --all"
echo "  3. Force push tags: git push --force --tags"
echo ""
echo "IMPORTANT: Notify your team members!"
echo "  They will need to:"
echo "    git fetch origin"
echo "    git reset --hard origin/main  (or master/main branch)"
echo ""

