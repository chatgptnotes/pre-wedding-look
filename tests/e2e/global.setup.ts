import { test as setup, expect } from '@playwright/test';
import { seedTestData } from '../../scripts/seed-test-data';
import fs from 'fs';
import path from 'path';

const authFile = 'tests/.auth/user.json';
const configFile = 'tests/test-config.json';

/**
 * Global setup for E2E tests
 * Seeds test data and authenticates test users
 */
setup('seed test data and authenticate', async ({ page }) => {
  console.log('🌱 Setting up test environment...');

  // Create auth directory
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Seed test data
  const config = await seedTestData();
  
  // Wait for database operations to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const testUser = config.users.find(u => u.email.includes('test1'));
  if (!testUser) {
    throw new Error('Test user not found in seeded data');
  }

  console.log(`🔐 Authenticating test user: ${testUser.email}`);

  // Navigate to app
  await page.goto('/');
  
  // Wait for app to load
  await page.waitForLoadState('networkidle');

  // Look for auth elements - check if there's a login button or user is already logged in
  const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")');
  const userProfile = page.locator('[data-testid="user-profile"], .user-menu');
  
  // If user menu is visible, user is already logged in (auth bypass in dev mode)
  const isLoggedIn = await userProfile.count() > 0;
  
  if (!isLoggedIn && await loginButton.count() > 0) {
    // Click login button
    await loginButton.first().click();
    
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', testUser.email);
    await page.fill('input[type="password"], input[name="password"]', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
  }

  // Verify authentication by checking for user-specific elements
  await page.waitForSelector('[data-testid="credits-display"], .credits-display, .user-menu', {
    timeout: 10000
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Authentication state saved');

  // Verify test data is accessible
  const creditsDisplay = page.locator('[data-testid="credits-display"], .credits-display');
  if (await creditsDisplay.count() > 0) {
    console.log('✅ Credits system is visible and working');
  }

  console.log('🎉 Test environment setup complete');
});