#!/bin/bash

# Alternative Git History Cleanup using built-in git commands
# This uses git filter-branch (slower but doesn't require extra tools)

set -e

echo "=== Git History Cleanup Script (Alternative Method) ==="
echo ""
echo "This script will:"
echo "  1. Remove .next/ directory from all Git history"
echo "  2. Remove node_modules/ from all Git history"
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

echo ""
echo "Step 1: Creating backup branch..."
git branch backup-before-cleanup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
echo "✓ Backup branch created"

echo ""
echo "Step 2: Removing .next/ and node_modules/ from Git history..."
echo "  (This may take several minutes...)"

# Remove .next and node_modules from all commits
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch .next node_modules" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "Step 3: Cleaning up refs and optimizing repository..."
# Remove backup refs created by filter-branch
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d 2>/dev/null || true

# Expire reflog and garbage collect
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
echo "    git reset --hard origin/main  (or their branch name)"
echo ""

