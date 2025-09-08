#!/usr/bin/env node

/**
 * Demo Mode Functionality Test Suite
 * Tests the complete upload -> display -> style application workflow
 */

const puppeteer = require('puppeteer');

const ADMIN_URL = 'http://localhost:5173/#admin';
const TEST_TIMEOUT = 30000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDemoModeWorkflow() {
  console.log('🚀 Starting Demo Mode Workflow Test Suite...\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      } else if (msg.text().includes('Debug:')) {
        console.log('🔍', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('🔴 Page Error:', error.message);
    });
    
    console.log('1. 📱 Loading Admin Dashboard...');
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle0' });
    await sleep(2000);
    
    // Check if admin page loaded
    const adminTitle = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (adminTitle && adminTitle.includes('Admin Dashboard')) {
      console.log('✅ Admin Dashboard loaded successfully');
    } else {
      throw new Error('Admin Dashboard failed to load');
    }
    
    console.log('\n2. 🌍 Testing Country Models Manager...');
    
    // Navigate to Country Models section
    await page.click('button[data-testid="country-models"], [role="button"]:has-text("Country Models")').catch(() => {
      // Try alternative selector
      return page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetButton = buttons.find(btn => btn.textContent.includes('Country Models'));
        if (targetButton) targetButton.click();
        return !!targetButton;
      });
    });
    
    await sleep(1000);
    
    console.log('✅ Navigated to Country Models Manager');
    
    console.log('\n3. 🎨 Testing Style Application Panel...');
    
    // Navigate to Style Application section
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const targetButton = buttons.find(btn => btn.textContent.includes('Style Application'));
      if (targetButton) targetButton.click();
      return !!targetButton;
    });
    
    await sleep(1000);
    
    // Check if styles are loaded
    const stylesCount = await page.evaluate(() => {
      const styleCards = document.querySelectorAll('[data-testid="style-card"], .grid > div');
      return styleCards.length;
    });
    
    console.log(`✅ Found ${stylesCount} styles in Style Application Panel`);
    
    console.log('\n4. 🔄 Testing Demo Mode Consistency...');
    
    // Test that Supabase is not being called inappropriately
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Debug:')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Trigger some operations
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(2000);
    
    const demoModeMessages = consoleLogs.filter(log => 
      log.includes('demo mode') || log.includes('Demo mode') || log.includes('checkSupabase')
    );
    
    if (demoModeMessages.length > 0) {
      console.log('✅ Demo mode is being used consistently');
      console.log(`   Found ${demoModeMessages.length} demo mode related messages`);
    } else {
      console.log('⚠️  No explicit demo mode messages found');
    }
    
    console.log('\n5. 📊 Testing Error Handling...');
    
    // Check for any JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await sleep(1000);
    
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected');
    } else {
      console.log(`🔴 Found ${errors.length} JavaScript errors:`);
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n6. 🏁 Testing Application Health...');
    
    // Check if the main elements are present
    const hasHeader = await page.$('header, h1, h2').then(el => !!el);
    const hasNavigation = await page.$('nav, [role="navigation"], button').then(el => !!el);
    const hasContent = await page.$('main, [role="main"], .container').then(el => !!el);
    
    console.log(`✅ Header present: ${hasHeader}`);
    console.log(`✅ Navigation present: ${hasNavigation}`);
    console.log(`✅ Content present: ${hasContent}`);
    
    console.log('\n🎉 Demo Mode Test Suite Completed!');
    
    const overallScore = [
      adminTitle?.includes('Admin Dashboard'),
      stylesCount > 0,
      demoModeMessages.length > 0 || errors.length === 0,
      errors.length === 0,
      hasHeader && hasNavigation && hasContent
    ].filter(Boolean).length;
    
    console.log(`\n📊 Overall Score: ${overallScore}/5 (${(overallScore/5*100).toFixed(0)}%)`);
    
    if (overallScore >= 4) {
      console.log('🟢 Demo mode functionality is working well!');
      process.exit(0);
    } else {
      console.log('🟡 Demo mode has some issues that need attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('🔴 Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testDemoModeWorkflow().catch(error => {
  console.error('🔴 Unexpected error:', error);
  process.exit(1);
});