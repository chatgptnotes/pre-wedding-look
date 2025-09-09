import { test as teardown } from '@playwright/test';
import { cleanTestData } from '../../scripts/seed-test-data';
import fs from 'fs';

/**
 * Global teardown for E2E tests
 * Cleans up test data and authentication files
 */
teardown('cleanup test data', async ({ }) => {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Clean test data from database
    await cleanTestData();
    
    // Remove authentication files
    const authFiles = [
      'tests/.auth/user.json',
      'tests/test-config.json'
    ];

    for (const file of authFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Removed ${file}`);
      }
    }

    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
});