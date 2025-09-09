# Git Worktrees Setup for Parallel Development

This directory contains 3 git worktrees for parallel feature development.

## 🌳 Available Worktrees

1. **`feature-1/`** → Branch: `feature/ui-enhancements`
   - Focus: UI/UX improvements, component enhancements, styling updates
   - Port: 5173 (main development)

2. **`feature-2/`** → Branch: `feature/game-enhancements` 
   - Focus: Game mechanics, multiplayer features, gameplay improvements
   - Port: 5174 (alternate port)

3. **`feature-3/`** → Branch: `feature/backend-optimizations`
   - Focus: Database optimization, Edge Functions, API improvements
   - Port: 5175 (alternate port)

## 🚀 How to Work with Worktrees

### Terminal Session Setup
Open 3 separate terminals and navigate to each worktree:

```bash
# Terminal 1 - UI Enhancements
cd "/Users/murali/Dating app v2/pre-wedding-look/.trees/feature-1"

# Terminal 2 - Game Enhancements  
cd "/Users/murali/Dating app v2/pre-wedding-look/.trees/feature-2"

# Terminal 3 - Backend Optimizations
cd "/Users/murali/Dating app v2/pre-wedding-look/.trees/feature-3"
```

### Development Workflow

#### 1. Start Development Server
In each terminal, install dependencies and start dev server:

```bash
npm install  # Only needed once per worktree
npm run dev  # Will auto-assign available port
```

#### 2. Make Changes
Each worktree is completely independent:
- Make commits in each worktree independently
- Changes don't affect other worktrees
- Each has its own git history

#### 3. Commit Changes
```bash
git add .
git commit -m "feat: your feature description"
```

#### 4. Push Branch
```bash
git push origin feature/ui-enhancements      # From feature-1
git push origin feature/game-enhancements    # From feature-2  
git push origin feature/backend-optimizations # From feature-3
```

## 🔄 Merging Features

### Before Deployment
Go back to the main project directory to merge all features:

```bash
cd "/Users/murali/Dating app v2/pre-wedding-look"

# Merge feature branches into main
git checkout main
git merge feature/ui-enhancements
git merge feature/game-enhancements  
git merge feature/backend-optimizations

# Handle any conflicts if they arise
# Then push to main
git push origin main
```

### Deploy to Vercel
```bash
vercel --prod
```

## 🛠️ Worktree Management

### View All Worktrees
```bash
git worktree list
```

### Remove a Worktree (when done)
```bash
git worktree remove .trees/feature-1
git branch -d feature/ui-enhancements
```

### Add New Worktree
```bash
git worktree add .trees/feature-4 -b feature/new-feature
```

## 📝 Best Practices

1. **One Feature Per Worktree**: Keep features isolated
2. **Regular Commits**: Commit frequently in each worktree
3. **Pull Updates**: Regularly pull main branch updates
4. **Merge Conflicts**: Resolve conflicts when merging back to main
5. **Clean Up**: Remove worktrees when features are complete

## 🔧 Troubleshooting

### Port Conflicts
If ports conflict, manually specify:
```bash
npm run dev -- --port 5176
```

### Dependencies Out of Sync
If dependencies differ between worktrees:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Merge Conflicts
When merging features back to main:
```bash
git status              # See conflicted files
git mergetool          # Use merge tool
git add .              # Stage resolved conflicts  
git commit             # Complete merge
```

## 📋 Current Feature Plan

- **UI Enhancements**: Modern design system, responsive improvements
- **Game Enhancements**: Real-time features, better matchmaking
- **Backend Optimizations**: Database performance, Edge Function improvements

Happy coding! 🚀