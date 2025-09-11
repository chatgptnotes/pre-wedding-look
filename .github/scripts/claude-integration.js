#!/usr/bin/env node

const { Anthropic } = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

async function processClaudeRequest() {
  const githubToken = process.env.GITHUB_TOKEN;
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueBody = process.env.ISSUE_BODY;
  const repository = process.env.GITHUB_REPOSITORY;
  const [owner, repo] = repository.split('/');

  if (!claudeApiKey) {
    console.error('CLAUDE_API_KEY is not set!');
    process.exit(1);
  }

  // Initialize APIs
  const anthropic = new Anthropic({ apiKey: claudeApiKey });
  const octokit = new Octokit({ auth: githubToken });

  try {
    // Extract the command from the issue body
    const commandMatch = issueBody.match(/@claude-code\s+(.*)/s);
    if (!commandMatch) {
      console.log('No @claude-code command found in issue');
      return;
    }

    const userRequest = commandMatch[1].trim();
    console.log('Processing request:', userRequest);

    // Get repository content for context
    const { data: repoContent } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'src'
    });

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a coding assistant for a React/TypeScript project. 
        The user has requested: "${userRequest}"
        
        Repository structure includes:
        - React with TypeScript
        - Tailwind CSS for styling
        - Supabase for backend
        
        Please provide the code changes needed to implement this request.
        Format your response as JSON with this structure:
        {
          "files": [
            {
              "path": "relative/path/to/file",
              "action": "create|modify|delete",
              "content": "file content here"
            }
          ],
          "summary": "Brief summary of changes"
        }`
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse Claude response as JSON');
    }

    const changes = JSON.parse(jsonMatch[1]);

    // Apply file changes
    for (const file of changes.files) {
      const filePath = path.join(process.cwd(), file.path);
      
      if (file.action === 'create' || file.action === 'modify') {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content);
        console.log(`${file.action}d: ${file.path}`);
      } else if (file.action === 'delete') {
        await fs.unlink(filePath);
        console.log(`Deleted: ${file.path}`);
      }
    }

    // Comment on the issue
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `✅ Claude has processed your request!\n\n**Changes made:**\n${changes.summary}\n\nA pull request will be created with these changes.`
    });

    // Set output for GitHub Actions
    console.log(`::set-output name=changes_made::true`);
    console.log(`::set-output name=summary::${changes.summary}`);

  } catch (error) {
    console.error('Error processing Claude request:', error);
    
    // Comment error on issue
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Error processing Claude request:\n\`\`\`\n${error.message}\n\`\`\``
    });
    
    process.exit(1);
  }
}

processClaudeRequest();