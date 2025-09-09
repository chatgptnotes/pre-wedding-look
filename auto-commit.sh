#!/bin/bash
# Auto-commit script for feature-2 worktree
# Usage: ./auto-commit.sh "commit message"

set -e

# Ensure we're in the feature-2 directory
cd "/Users/murali/Dating app v2/pre-wedding-look/.trees/feature-2"

# Add all changes
git add .

# Commit with provided message or default
MESSAGE="${1:-feat: automated commit from feature-2 development}"
git commit -m "$MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin feature/game-enhancements

echo "✅ Changes committed and pushed to feature/game-enhancements"