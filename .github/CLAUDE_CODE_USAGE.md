# Claude Code GitHub Integration

This repository is configured to use Claude Code directly within GitHub issues for automated coding tasks.

## How to Use

### 1. Create a New Issue
Use the "Coding Task" template when creating a new issue, or add the `claude-code` label to any issue.

### 2. Trigger Claude Code
You can trigger Claude Code in two ways:

#### In Issue Description:
```markdown
@claude-code implement a new feature that adds user authentication
```

#### In Issue Comments:
```markdown
@claude-code fix the bug in the login component
```

### 3. Available Commands

- `@claude-code` - General coding request
- `/implement` - Request new feature implementation
- `/fix` - Request bug fix
- `/refactor` - Request code refactoring
- `/test` - Request test creation

### 4. Example Usage

```markdown
@claude-code implement the following:
- Add a new dashboard component in src/components/Dashboard.tsx
- Include charts for user analytics
- Use Tailwind CSS for styling
- Add TypeScript types
```

### 5. What Happens Next

1. Claude Code bot will process your request
2. A new branch will be created automatically
3. Code changes will be applied based on your instructions
4. A Pull Request will be created with the changes
5. You can review and merge the PR

## Configuration

The integration is configured via `.github/claude-code.config.json`

## Security

- Protected paths cannot be modified by Claude Code
- All changes go through Pull Request review
- Sensitive files (.env, database configs) are protected

## Requirements

### GitHub Secrets Required:
- `CLAUDE_API_KEY` - Your Claude API key (get from https://console.anthropic.com)

### Setting up the Secret:
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CLAUDE_API_KEY`
4. Value: Your API key
5. Click "Add secret"

## Troubleshooting

If Claude Code doesn't respond:
1. Check if the `claude-code` label is applied
2. Verify the GitHub Action is running (Actions tab)
3. Check workflow logs for errors
4. Ensure CLAUDE_API_KEY is set correctly

## Support

For issues with the Claude Code integration, create an issue with the `claude-code-help` label.