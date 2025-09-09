#!/bin/bash

# Push changes from main to feature3 worktree
echo "🚀 Pushing changes to feature3 worktree..."

# Add and commit changes in main
git add .
git commit -m "feat: Updates for feature3 branch

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Switch to feature3 worktree
cd .trees/feature-3

# Pull latest changes from main
git merge main

# Push to remote feature branch
git push origin feature/backend-optimizations

echo "✅ Successfully pushed to feature3 worktree!"