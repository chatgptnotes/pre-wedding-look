#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';

async function processClaudeRequest() {
  const githubToken = process.env.GITHUB_TOKEN;
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueBody = process.env.ISSUE_BODY;
  const repository = process.env.GITHUB_REPOSITORY;
  const [owner, repo] = repository.split('/');

  console.log('Starting Claude integration...');
  console.log('Repository:', repository);
  console.log('Issue Number:', issueNumber);

  if (!claudeApiKey) {
    console.error('ERROR: CLAUDE_API_KEY is not set!');
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
    console.log('Processing request:', userRequest.substring(0, 100) + '...');

    // Call Claude API with the full issue context
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a coding assistant for a React/TypeScript project. 
        
The user has created a GitHub issue with the following request:
${issueBody}

Please provide the code changes needed to implement this request.
Format your response as JSON with this structure:
{
  "files": [
    {
      "path": "relative/path/to/file",
      "action": "create|modify",
      "content": "complete file content here"
    }
  ],
  "summary": "Brief summary of changes"
}

For the Hero video background request, you should:
1. Add a video background to src/components/Hero.tsx
2. Ensure it's full width, muted, looped, and autoplays
3. Add a fallback image for mobile
4. Ensure responsive design
5. Optimize video performance

Provide the complete file content, not just snippets.`
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    console.log('Claude response received');
    
    // Try to extract JSON from the response
    let changes;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    
    if (jsonMatch) {
      changes = JSON.parse(jsonMatch[1]);
    } else {
      // Try parsing the entire response as JSON
      try {
        changes = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Could not parse Claude response as JSON');
      }
    }

    console.log(`Processing ${changes.files.length} file changes...`);

    // Apply file changes
    for (const file of changes.files) {
      const filePath = path.join(process.cwd(), file.path);
      
      if (file.action === 'create' || file.action === 'modify') {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content);
        console.log(`${file.action}d: ${file.path}`);
      }
    }

    // Comment on the issue
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: parseInt(issueNumber),
      body: `✅ Claude has processed your request!

**Changes made:**
${changes.summary}

**Files modified:**
${changes.files.map(f => `- ${f.path}`).join('\n')}

A pull request will be created with these changes shortly.`
    });

    console.log('Successfully commented on issue');

  } catch (error) {
    console.error('Error processing Claude request:', error.message);
    console.error('Full error:', error);
    
    // Comment error on issue
    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: parseInt(issueNumber),
        body: `❌ Error processing Claude request:
\`\`\`
${error.message}
\`\`\`

Please check the workflow logs for more details.`
      });
    } catch (commentError) {
      console.error('Failed to comment error on issue:', commentError);
    }
    
    process.exit(1);
  }
}

processClaudeRequest();