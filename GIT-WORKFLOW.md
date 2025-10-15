# Git Workflow Guide

## Branch Strategy

We use a simple two-branch workflow:

- **`main`** - Production-ready code. Deploys to EC2 automatically.
- **`develop`** - Development branch. Test features here before merging to main.

## Daily Workflow

### 1. Start Working (Always work on develop)

```bash
# Switch to develop branch
git checkout develop

# Make sure you have the latest changes
git pull origin develop
```

### 2. Make Your Changes

```bash
# Make code changes...
# Test locally...

# Check what changed
git status
git diff
```

### 3. Commit Your Changes

```bash
# Add files
git add .

# Commit with a descriptive message
git commit -m "Add user authentication feature"

# Push to develop branch
git push origin develop
```

### 4. Test on Development Environment (Optional)

If you have a development EC2 instance, you can deploy the `develop` branch there for testing.

### 5. Ready for Production? Merge to Main

When your changes are tested and ready for production:

```bash
# Switch to main branch
git checkout main

# Pull latest main
git pull origin main

# Merge develop into main
git merge develop

# Push to main (this will deploy to production EC2)
git push origin main

# Switch back to develop for continued work
git checkout develop
```

## Common Scenarios

### Creating a New Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create a feature branch (optional, for larger features)
git checkout -b feature/user-management

# Make changes, commit
git add .
git commit -m "Add user management feature"

# Merge back to develop
git checkout develop
git merge feature/user-management

# Push develop
git push origin develop

# Delete feature branch (cleanup)
git branch -d feature/user-management
```

### Hotfix for Production

If you need to fix a critical bug in production immediately:

```bash
# Start from main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-bug

# Fix the bug, commit
git add .
git commit -m "Fix critical authentication bug"

# Merge to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# Also merge to develop to keep it updated
git checkout develop
git merge hotfix/critical-bug
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

### Checking Your Current Branch

```bash
git branch
# The branch with * is your current branch
```

### Viewing Commit History

```bash
# See recent commits
git log --oneline -10

# See what's different between develop and main
git log main..develop --oneline
```

### Undoing Uncommitted Changes

```bash
# Discard all local changes (be careful!)
git reset --hard HEAD

# Discard changes to a specific file
git checkout -- path/to/file
```

## Quick Reference

```bash
# Switch branches
git checkout main          # Switch to main
git checkout develop       # Switch to develop

# Check status
git status                 # See what changed
git branch                 # See all branches
git log --oneline -5       # See recent commits

# Common workflow
git checkout develop       # Work on develop
git pull                   # Get latest
# ... make changes ...
git add .                  # Stage changes
git commit -m "message"    # Commit
git push                   # Push to develop

# Deploy to production
git checkout main          # Switch to main
git merge develop          # Merge develop
git push                   # Deploy to production
git checkout develop       # Back to develop
```

## Important Notes

- **Always work on `develop`** for new features
- **Only merge to `main`** when you're ready to deploy to production
- **Test thoroughly** on develop before merging to main
- **Pull before you push** to avoid conflicts
- **Write clear commit messages** to track changes

## Current Branch Setup

You're currently on the **`develop`** branch. You can check this anytime with:

```bash
git branch
```

The branch with a `*` is your current branch.
