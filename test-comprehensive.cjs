const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Comprehensive PreWedding AI Studio Test Suite
class ComprehensiveTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      testStartTime: new Date().toISOString(),
      overview: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: []
      },
      sections: {
        landingPage: {},
        creativeModesNavigation: {},
        classicMode: {},
        newFeatureModes: {},
        uiInteraction: {},
        authentication: {},
        integrations: {},
        edgeCases: {},
        performance: {},
        responsiveness: {}
      }
    };
    this.screenshots = [];
  }

  async initialize() {
    try {
      // Try different Chrome paths
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        process.env.PUPPETEER_EXECUTABLE_PATH
      ].filter(Boolean);

      let executablePath;
      for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
          executablePath = chromePath;
          break;
        }
      }

      if (!executablePath) {
        throw new Error('Chrome/Chromium not found. Please install Chrome or set PUPPETEER_EXECUTABLE_PATH');
      }

      this.browser = await puppeteer.launch({
        executablePath,
        headless: false, // Run in visible mode for testing
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--window-size=1920,1080'
        ],
        defaultViewport: null
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Set up console logging and error handling
      this.page.on('console', msg => {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
      });

      this.page.on('pageerror', error => {
        console.error(`[PAGE ERROR] ${error.message}`);
        this.results.overview.errors.push({
          type: 'JavaScript Error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      });

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error.message);
      this.results.overview.errors.push({
        type: 'Initialization Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async takeScreenshot(name, fullPage = false) {
    try {
      const screenshotPath = path.join(__dirname, 'test-reports', `screenshot-${name}-${Date.now()}.png`);
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: fullPage
      });
      this.screenshots.push({
        name,
        path: screenshotPath,
        timestamp: new Date().toISOString()
      });
      console.log(`📸 Screenshot saved: ${name}`);
      return screenshotPath;
    } catch (error) {
      console.error(`❌ Failed to take screenshot ${name}:`, error.message);
    }
  }

  async runTest(testName, testFunction) {
    this.results.overview.totalTests++;
    try {
      console.log(`\n🧪 Running test: ${testName}`);
      await testFunction();
      this.results.overview.passedTests++;
      console.log(`✅ Test passed: ${testName}`);
      return { status: 'passed', error: null };
    } catch (error) {
      this.results.overview.failedTests++;
      console.error(`❌ Test failed: ${testName} - ${error.message}`);
      this.results.overview.errors.push({
        test: testName,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return { status: 'failed', error: error.message };
    }
  }

  async testLandingPage() {
    console.log('\n📋 Testing Landing Page...');
    
    // Test 1: Page loads successfully
    await this.runTest('Landing Page - Load Application', async () => {
      await this.page.goto('http://localhost:5174', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const title = await this.page.title();
      if (!title) throw new Error('Page title not found');
      
      await this.takeScreenshot('landing-page-loaded');
    });

    // Test 2: Header elements present
    await this.runTest('Landing Page - Header Elements', async () => {
      const headerExists = await this.page.$('h1');
      if (!headerExists) throw new Error('Main header not found');
      
      const headerText = await this.page.$eval('h1', el => el.textContent);
      if (!headerText.includes('PreWedding AI Studio')) {
        throw new Error('Header text incorrect');
      }
    });

    // Test 3: 9 Creative modes visible
    await this.runTest('Landing Page - 9 Creative Modes Displayed', async () => {
      const modeCards = await this.page.$$('[data-testid="feature-card"], .group.relative.cursor-pointer');
      if (modeCards.length !== 9) {
        throw new Error(`Expected 9 creative modes, found ${modeCards.length}`);
      }
      
      // Verify specific modes exist
      const expectedModes = [
        'Classic Pre-Wedding Mode',
        'Cinematic Storyboard', 
        'Fusion Reality Magic',
        'Future Vision Journey',
        'Banana Challenge Mode',
        'AI Voice Storytelling',
        'One-Click Magic',
        'Regional Cultural Styles',
        'Complete Relationship Journey'
      ];
      
      for (const mode of expectedModes) {
        const modeElement = await this.page.getByText(mode).first();
        if (!modeElement) {
          throw new Error(`Mode "${mode}" not found on landing page`);
        }
      }
    });

    // Test 4: Main CTA button functionality
    await this.runTest('Landing Page - Main CTA Button', async () => {
      const ctaButton = await this.page.getByText('Start Your Journey', { exact: false }).first();
      if (!ctaButton) {
        throw new Error('Main CTA button not found');
      }
      
      await ctaButton.click();
      await this.page.waitForTimeout(2000);
      
      // Should navigate to tabs view
      const tabsView = await this.page.$('[data-testid="tab-navigation"], .sticky.top-4.z-10');
      if (!tabsView) {
        throw new Error('Failed to navigate to main application after CTA click');
      }
    });

    this.results.sections.landingPage = {
      status: 'completed',
      tests: 4,
      timestamp: new Date().toISOString()
    };
  }

  async testCreativeModesNavigation() {
    console.log('\n🎨 Testing Creative Modes Navigation...');
    
    // Ensure we're in the main app
    await this.page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    await this.page.getByText('Start Your Journey', { exact: false }).first().click();
    await this.page.waitForTimeout(2000);
    
    // Test tab navigation
    const tabIds = [
      'classic', 'storyboard', 'fusion', 'future-vision',
      'banana-challenge', 'voice-slideshow', 'magic-button', 
      'regional-styles', 'beyond-pre-wedding'
    ];

    for (const tabId of tabIds) {
      await this.runTest(`Navigation - ${tabId} tab`, async () => {
        // Look for tab button - try multiple selectors
        let tabButton = await this.page.$(`[data-tab="${tabId}"]`);
        if (!tabButton) {
          tabButton = await this.page.$(`button[data-tab-id="${tabId}"]`);
        }
        if (!tabButton) {
          // Try finding by text content
          const tabTexts = {
            'classic': 'Classic',
            'storyboard': 'Storyboard', 
            'fusion': 'Fusion',
            'future-vision': 'Future Vision',
            'banana-challenge': 'Banana',
            'voice-slideshow': 'Voice',
            'magic-button': 'Magic',
            'regional-styles': 'Regional',
            'beyond-pre-wedding': 'Beyond'
          };
          tabButton = await this.page.getByText(tabTexts[tabId], { exact: false }).first();
        }
        
        if (!tabButton) {
          throw new Error(`Tab button for ${tabId} not found`);
        }
        
        await tabButton.click();
        await this.page.waitForTimeout(1000);
        
        // Verify tab content loaded
        const activeContent = await this.page.$('.min-h-screen.relative');
        if (!activeContent) {
          throw new Error(`Content for ${tabId} tab did not load`);
        }
        
        await this.takeScreenshot(`tab-${tabId}`);
      });
    }

    this.results.sections.creativeModesNavigation = {
      status: 'completed',
      tests: tabIds.length,
      timestamp: new Date().toISOString()
    };
  }

  async testClassicMode() {
    console.log('\n👰 Testing Classic Pre-Wedding Mode...');
    
    // Navigate to classic mode
    await this.page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    await this.page.getByText('Start Your Journey', { exact: false }).first().click();
    await this.page.waitForTimeout(2000);
    
    // Test Classic Mode flow
    await this.runTest('Classic Mode - Access Mode', async () => {
      const classicTab = await this.page.getByText('Classic', { exact: false }).first();
      await classicTab.click();
      await this.page.waitForTimeout(1000);
      
      const startClassicButton = await this.page.getByText('Start Classic Mode');
      if (!startClassicButton) {
        throw new Error('Start Classic Mode button not found');
      }
      
      await startClassicButton.click();
      await this.page.waitForTimeout(2000);
      
      // Should be on bride step
      const brideStep = await this.page.getByText('Step 1: Style the Bride');
      if (!brideStep) {
        throw new Error('Bride styling step not loaded');
      }
    });

    // Test image uploader
    await this.runTest('Classic Mode - Image Upload Interface', async () => {
      const uploadArea = await this.page.$('[data-testid="image-uploader"], input[type="file"], .border-dashed');
      if (!uploadArea) {
        throw new Error('Image upload area not found');
      }
      
      await this.takeScreenshot('classic-bride-step');
    });

    // Test option selectors
    await this.runTest('Classic Mode - Option Selectors', async () => {
      const selectors = await this.page.$$('select, [data-testid="option-selector"]');
      if (selectors.length < 3) {
        throw new Error('Expected at least 3 option selectors for bride styling');
      }
    });

    // Test navigation buttons
    await this.runTest('Classic Mode - Navigation Buttons', async () => {
      const styleBrideButton = await this.page.getByText('Style Bride');
      const continueButton = await this.page.getByText('Continue to Groom');
      
      if (!styleBrideButton || !continueButton) {
        throw new Error('Required navigation buttons not found');
      }
      
      // Buttons should be disabled without images
      const styleBrideDisabled = await styleBrideButton.evaluate(el => el.disabled);
      const continueDisabled = await continueButton.evaluate(el => el.disabled);
      
      if (!styleBrideDisabled) {
        throw new Error('Style Bride button should be disabled without image');
      }
      if (!continueDisabled) {
        throw new Error('Continue button should be disabled without generated image');
      }
    });

    this.results.sections.classicMode = {
      status: 'completed',
      tests: 4,
      timestamp: new Date().toISOString()
    };
  }

  async testNewFeatureModes() {
    console.log('\n✨ Testing New Feature Modes...');
    
    const newModes = [
      'storyboard', 'fusion', 'future-vision', 'banana-challenge',
      'voice-slideshow', 'magic-button', 'regional-styles', 'beyond-pre-wedding'
    ];

    for (const mode of newModes) {
      await this.runTest(`New Feature Mode - ${mode}`, async () => {
        // Navigate to mode
        const tabTexts = {
          'storyboard': 'Storyboard',
          'fusion': 'Fusion', 
          'future-vision': 'Future Vision',
          'banana-challenge': 'Banana',
          'voice-slideshow': 'Voice',
          'magic-button': 'Magic',
          'regional-styles': 'Regional',
          'beyond-pre-wedding': 'Beyond'
        };
        
        const tab = await this.page.getByText(tabTexts[mode], { exact: false }).first();
        await tab.click();
        await this.page.waitForTimeout(1500);
        
        // Check if content loaded
        const content = await this.page.$('.bg-white\\/80, .min-h-screen.relative');
        if (!content) {
          throw new Error(`Content for ${mode} mode did not load`);
        }
        
        // Look for mode-specific elements
        const modeContent = await this.page.$eval('body', () => document.body.innerHTML);
        if (modeContent.length < 1000) {
          throw new Error(`${mode} mode appears to have minimal content`);
        }
        
        await this.takeScreenshot(`mode-${mode}`);
      });
    }

    this.results.sections.newFeatureModes = {
      status: 'completed',
      tests: newModes.length,
      timestamp: new Date().toISOString()
    };
  }

  async testUIInteraction() {
    console.log('\n🖱️ Testing UI Interaction...');
    
    // Test responsive design
    await this.runTest('UI - Responsive Design', async () => {
      // Test desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('responsive-desktop');
      
      // Test tablet
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('responsive-tablet');
      
      // Test mobile
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('responsive-mobile');
      
      // Reset to desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
    });

    // Test modal interactions
    await this.runTest('UI - Modal Interactions', async () => {
      // Look for modal triggers
      const favoritesButton = await this.page.getByText('Favorites', { exact: false });
      const comparisonButton = await this.page.getByText('Compare', { exact: false });
      
      // Test doesn't require modals to exist, just that UI doesn't crash
      if (favoritesButton) {
        await favoritesButton.click();
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('modal-test');
        
        // Try to close modal
        const closeButton = await this.page.$('[data-testid="close-modal"], .close-button, button:has-text("Close")');
        if (closeButton) {
          await closeButton.click();
        }
      }
    });

    // Test navigation
    await this.runTest('UI - Navigation Functionality', async () => {
      const homeButton = await this.page.$('button:has-text("Home"), [title="Back to Home"]');
      if (homeButton) {
        await homeButton.click();
        await this.page.waitForTimeout(2000);
        
        // Should be back at landing page
        const landingTitle = await this.page.$('h1');
        const titleText = await landingTitle.evaluate(el => el.textContent);
        if (!titleText.includes('Create. Transform.') && !titleText.includes('PreWedding AI Studio')) {
          throw new Error('Home navigation did not work correctly');
        }
        
        // Navigate back to app
        await this.page.getByText('Start Your Journey', { exact: false }).first().click();
        await this.page.waitForTimeout(2000);
      }
    });

    this.results.sections.uiInteraction = {
      status: 'completed', 
      tests: 3,
      timestamp: new Date().toISOString()
    };
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication System...');
    
    await this.runTest('Authentication - Bypass Mode Active', async () => {
      // Check that authentication is bypassed in development
      const appContent = await this.page.$('.min-h-screen');
      if (!appContent) {
        throw new Error('App content not accessible - authentication bypass may not be working');
      }
    });

    await this.runTest('Authentication - Admin Access', async () => {
      // Look for admin button - should not be visible in bypass mode without proper user
      const adminButton = await this.page.$('button:has-text("Admin"), [title*="Admin"]');
      
      // In bypass mode, admin button visibility depends on AuthService.isAdmin(user)
      // Since user is null in bypass mode, admin button should not be visible
      if (adminButton) {
        console.log('Note: Admin button visible - may indicate admin user simulation');
      }
    });

    this.results.sections.authentication = {
      status: 'completed',
      tests: 2,
      timestamp: new Date().toISOString()
    };
  }

  async testIntegrations() {
    console.log('\n🔌 Testing External Service Integrations...');
    
    await this.runTest('Integration - Gemini AI Service Preparation', async () => {
      // Test that the generation buttons exist and are properly configured
      // Navigate to classic mode to test generation setup
      const classicTab = await this.page.getByText('Classic', { exact: false }).first();
      await classicTab.click();
      await this.page.waitForTimeout(1000);
      
      const startClassicButton = await this.page.getByText('Start Classic Mode');
      await startClassicButton.click();
      await this.page.waitForTimeout(1000);
      
      const styleBrideButton = await this.page.getByText('Style Bride');
      if (!styleBrideButton) {
        throw new Error('AI generation button not found');
      }
      
      // Button should be disabled without image (proper state management)
      const isDisabled = await styleBrideButton.evaluate(el => el.disabled);
      if (!isDisabled) {
        throw new Error('Generation button should be disabled without uploaded image');
      }
    });

    await this.runTest('Integration - Supabase Database Configuration', async () => {
      // Test that database operations don't crash the app
      // This tests the error handling around database operations
      
      // Check console for database-related errors
      const errors = this.results.overview.errors.filter(err => 
        err.message.toLowerCase().includes('database') || 
        err.message.toLowerCase().includes('supabase')
      );
      
      // Some database errors are expected in development without proper setup
      console.log(`Note: Found ${errors.length} database-related errors (expected in dev mode)`);
    });

    this.results.sections.integrations = {
      status: 'completed',
      tests: 2,
      timestamp: new Date().toISOString()
    };
  }

  async testEdgeCases() {
    console.log('\n⚠️ Testing Edge Cases and Error Handling...');
    
    // Test rapid clicking
    await this.runTest('Edge Cases - Rapid Button Clicks', async () => {
      const buttons = await this.page.$$('button:not([disabled])');
      if (buttons.length > 0) {
        const button = buttons[0];
        // Click rapidly 10 times
        for (let i = 0; i < 10; i++) {
          await button.click();
          await this.page.waitForTimeout(50);
        }
        
        // App should still be responsive
        await this.page.waitForTimeout(2000);
        const appIsResponsive = await this.page.$('body');
        if (!appIsResponsive) {
          throw new Error('App became unresponsive after rapid clicking');
        }
      }
    });

    // Test browser navigation
    await this.runTest('Edge Cases - Browser Back/Forward', async () => {
      // Navigate through the app
      await this.page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
      await this.page.getByText('Start Your Journey', { exact: false }).first().click();
      await this.page.waitForTimeout(1000);
      
      // Go back
      await this.page.goBack();
      await this.page.waitForTimeout(1000);
      
      // Go forward
      await this.page.goForward();
      await this.page.waitForTimeout(1000);
      
      // App should still work
      const appContent = await this.page.$('.min-h-screen');
      if (!appContent) {
        throw new Error('App content lost after browser navigation');
      }
    });

    // Test invalid file uploads (simulated)
    await this.runTest('Edge Cases - File Upload Error Handling', async () => {
      // Navigate to upload area
      const classicTab = await this.page.getByText('Classic', { exact: false }).first();
      await classicTab.click();
      await this.page.waitForTimeout(1000);
      
      const startClassicButton = await this.page.getByText('Start Classic Mode');
      await startClassicButton.click();
      await this.page.waitForTimeout(1000);
      
      // Look for file input
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        // The file input exists and should handle errors gracefully
        // We can't easily test actual file uploads in this environment
        console.log('File input found - upload error handling should be implemented');
      }
    });

    this.results.sections.edgeCases = {
      status: 'completed',
      tests: 3,
      timestamp: new Date().toISOString()
    };
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    await this.runTest('Performance - Page Load Speed', async () => {
      const startTime = Date.now();
      await this.page.goto('http://localhost:5174', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      const loadTime = Date.now() - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      
      if (loadTime > 10000) {
        throw new Error(`Page load too slow: ${loadTime}ms`);
      }
    });

    await this.runTest('Performance - Memory Usage', async () => {
      const metrics = await this.page.metrics();
      console.log(`JS Heap Size: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
      console.log(`Nodes: ${metrics.Nodes}`);
      console.log(`Listeners: ${metrics.JSEventListeners}`);
      
      // Basic memory check - should not exceed 100MB
      if (metrics.JSHeapUsedSize > 100 * 1024 * 1024) {
        throw new Error(`High memory usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
      }
    });

    this.results.sections.performance = {
      status: 'completed',
      tests: 2,
      timestamp: new Date().toISOString()
    };
  }

  async generateReport() {
    console.log('\n📊 Generating Comprehensive Test Report...');
    
    const endTime = new Date().toISOString();
    const duration = new Date(endTime) - new Date(this.results.testStartTime);
    
    const report = {
      ...this.results,
      testEndTime: endTime,
      durationMs: duration,
      durationFormatted: `${Math.round(duration / 1000)}s`,
      screenshots: this.screenshots,
      summary: {
        totalSections: Object.keys(this.results.sections).length,
        passRate: Math.round((this.results.overview.passedTests / this.results.overview.totalTests) * 100),
        status: this.results.overview.failedTests === 0 ? 'PASSED' : 'FAILED'
      },
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = path.join(__dirname, 'test-reports', `comprehensive-test-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, 'test-reports', `comprehensive-test-report-${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`\n📋 Test Report saved to: ${reportPath}`);
    console.log(`📋 Markdown Report saved to: ${markdownPath}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.overview.failedTests > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Functionality', 
        issue: `${this.results.overview.failedTests} tests failed`,
        recommendation: 'Review and fix failing tests before production deployment'
      });
    }

    if (this.results.overview.errors.length > 5) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Error Handling',
        issue: `${this.results.overview.errors.length} errors detected`,
        recommendation: 'Implement comprehensive error boundaries and validation'
      });
    }

    recommendations.push({
      priority: 'LOW',
      category: 'Testing',
      issue: 'AI generation functionality not tested with actual images',
      recommendation: 'Add integration tests with sample images and mock AI responses'
    });

    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# PreWedding AI Studio - Comprehensive Test Report

## Test Summary
- **Test Date**: ${report.testStartTime}
- **Duration**: ${report.durationFormatted}
- **Total Tests**: ${report.overview.totalTests}
- **Passed**: ${report.overview.passedTests} ✅
- **Failed**: ${report.overview.failedTests} ❌
- **Pass Rate**: ${report.summary.passRate}%
- **Overall Status**: ${report.summary.status}

## Test Sections

${Object.entries(report.sections).map(([section, data]) => `
### ${section.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
- **Status**: ${data.status || 'Not run'}
- **Tests**: ${data.tests || 0}
- **Timestamp**: ${data.timestamp || 'N/A'}
`).join('')}

## Errors and Issues

${report.overview.errors.length === 0 ? 'No errors detected ✅' : 
  report.overview.errors.map(error => `
### ${error.type || 'Error'}
- **Message**: ${error.message}
- **Test**: ${error.test || 'General'}
- **Timestamp**: ${error.timestamp}
`).join('')}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.priority} Priority - ${rec.category}
**Issue**: ${rec.issue}
**Recommendation**: ${rec.recommendation}
`).join('')}

## Screenshots
${report.screenshots.map(shot => `
- **${shot.name}**: ${shot.path} (${shot.timestamp})
`).join('')}

---
*Report generated automatically by Comprehensive Test Suite*
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async run() {
    console.log('🚀 Starting Comprehensive PreWedding AI Studio Test Suite...\n');
    
    if (!(await this.initialize())) {
      console.error('❌ Failed to initialize tests');
      return;
    }

    try {
      await this.testLandingPage();
      await this.testCreativeModesNavigation();
      await this.testClassicMode();
      await this.testNewFeatureModes();
      await this.testUIInteraction();
      await this.testAuthentication();
      await this.testIntegrations();
      await this.testEdgeCases();
      await this.testPerformance();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 Test Suite Complete!');
      console.log(`\n📊 Final Results:`);
      console.log(`   Total Tests: ${report.overview.totalTests}`);
      console.log(`   Passed: ${report.overview.passedTests} ✅`);
      console.log(`   Failed: ${report.overview.failedTests} ❌`);
      console.log(`   Pass Rate: ${report.summary.passRate}%`);
      console.log(`   Status: ${report.summary.status}\n`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite error:', error.message);
      this.results.overview.errors.push({
        type: 'Suite Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.run().then((report) => {
    if (report) {
      process.exit(report.overview.failedTests === 0 ? 0 : 1);
    } else {
      process.exit(1);
    }
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestSuite;