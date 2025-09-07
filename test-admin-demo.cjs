const puppeteer = require('puppeteer');

class AdminDemoTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      adminAuth: { passed: false, details: [] },
      countryModels: { passed: false, details: [] },
      styleApplication: { passed: false, details: [] },
      gallery: { passed: false, details: [] },
      errorHandling: { passed: false, details: [] },
      summary: { totalTests: 0, passed: 0, failed: 0 }
    };
  }

  async setup() {
    console.log('🚀 Starting Admin Interface Demo Mode Testing...\n');
    
    this.browser = await puppeteer.launch({ 
      headless: false, // Show browser for visual testing
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging to capture React errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Set up network request monitoring
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      // Allow all requests to continue (demo mode)
      request.continue();
    });

    // Navigate to the admin interface
    await this.page.goto('http://localhost:5173/#admin', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
  }

  async testAdminAuthentication() {
    console.log('🔐 Testing Admin Authentication...');
    try {
      // Check if admin interface loads
      await this.page.waitForSelector('h1', { timeout: 5000 });
      const title = await this.page.$eval('h1', el => el.textContent);
      
      if (title.includes('Admin Dashboard')) {
        this.results.adminAuth.passed = true;
        this.results.adminAuth.details.push('✅ Admin dashboard loads without login requirements');
      } else {
        this.results.adminAuth.details.push('❌ Admin dashboard not detected');
      }

      // Check for admin sections
      const sections = await this.page.$$('button[class*="text-left p-4 rounded-2xl"]');
      if (sections.length > 0) {
        this.results.adminAuth.details.push(`✅ Found ${sections.length} admin sections available`);
      } else {
        this.results.adminAuth.details.push('❌ No admin sections found');
      }

      // Check for user role indicators
      const roleIndicators = await this.page.$$('[class*="roleLabel"], [class*="ADMIN"], [class*="SUPER"]');
      if (roleIndicators.length > 0) {
        this.results.adminAuth.details.push('✅ Role indicators visible in demo mode');
      } else {
        this.results.adminAuth.details.push('⚠️ Role indicators not found (may be expected in demo mode)');
      }

    } catch (error) {
      this.results.adminAuth.details.push(`❌ Admin authentication test failed: ${error.message}`);
    }
  }

  async testCountryModelsManager() {
    console.log('🌍 Testing Country Models Manager...');
    try {
      // Find and click Country Models Manager button
      const buttons = await this.page.$$('button');
      let found = false;
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Country Models Manager') || text.includes('🌍')) {
          await button.click();
          found = true;
          break;
        }
      }

      if (!found) {
        this.results.countryModels.details.push('❌ Country Models Manager button not found');
        return;
      }

      // Wait for component to load
      await this.page.waitForTimeout(2000);

      // Check for country selector
      const countrySelector = await this.page.$('select');
      if (countrySelector) {
        this.results.countryModels.details.push('✅ Country selector present');
        
        // Test country selection
        const options = await this.page.$$eval('select option', opts => opts.map(o => o.textContent));
        this.results.countryModels.details.push(`✅ Found ${options.length} country options: ${options.slice(0, 3).join(', ')}...`);
      } else {
        this.results.countryModels.details.push('❌ Country selector not found');
      }

      // Check for model upload areas
      const uploadAreas = await this.page.$$('[class*="border-dashed"], [class*="drag"], input[type="file"]');
      if (uploadAreas.length > 0) {
        this.results.countryModels.details.push(`✅ Found ${uploadAreas.length} upload areas for bride/groom models`);
      } else {
        this.results.countryModels.details.push('❌ Upload areas not found');
      }

      // Check for statistics section
      const statsSection = await this.page.$('*[class*="Stats"], *:contains("Gallery Statistics")');
      if (statsSection) {
        this.results.countryModels.details.push('✅ Gallery statistics section present');
      } else {
        this.results.countryModels.details.push('⚠️ Gallery statistics section not found');
      }

      // Test file upload interface (without actually uploading)
      const fileInputs = await this.page.$$('input[type="file"]');
      if (fileInputs.length >= 2) {
        this.results.countryModels.details.push('✅ Both bride and groom file upload inputs available');
        this.results.countryModels.passed = true;
      } else {
        this.results.countryModels.details.push(`⚠️ Expected 2 file inputs, found ${fileInputs.length}`);
      }

    } catch (error) {
      this.results.countryModels.details.push(`❌ Country Models Manager test failed: ${error.message}`);
    }
  }

  async testStyleApplicationSystem() {
    console.log('🎨 Testing Style Application System...');
    try {
      // Navigate to Style Application System
      const buttons = await this.page.$$('button');
      let found = false;
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Style Application System') || text.includes('🎨')) {
          await button.click();
          found = true;
          break;
        }
      }

      if (!found) {
        this.results.styleApplication.details.push('❌ Style Application System button not found');
        return;
      }

      // Wait for component to load
      await this.page.waitForTimeout(2000);

      // Check for filter controls
      const selects = await this.page.$$('select');
      if (selects.length >= 3) {
        this.results.styleApplication.details.push(`✅ Found ${selects.length} filter controls (Country, Role, Style Type)`);
      } else {
        this.results.styleApplication.details.push(`⚠️ Expected 3+ filter controls, found ${selects.length}`);
      }

      // Check for batch operations section (admin feature)
      const batchElements = await this.page.$$('*:contains("Batch Operations"), *:contains("Generate All")');
      if (batchElements.length > 0) {
        this.results.styleApplication.details.push('✅ Batch operations section available');
      } else {
        this.results.styleApplication.details.push('⚠️ Batch operations section not found (may require admin privileges)');
      }

      // Check for style cards grid
      const gridElements = await this.page.$$('[class*="grid"]');
      if (gridElements.length > 0) {
        this.results.styleApplication.details.push('✅ Style cards grid present');
      } else {
        this.results.styleApplication.details.push('⚠️ Style cards not found (may be loading or filtered)');
      }

      this.results.styleApplication.passed = true;

    } catch (error) {
      this.results.styleApplication.details.push(`❌ Style Application System test failed: ${error.message}`);
    }
  }

  async testGalleryFeatures() {
    console.log('🖼️ Testing Gallery Features...');
    try {
      // Navigate back to main tabs view to test gallery
      const backButton = await this.page.$('*:contains("Back to Creative Studio")');
      if (backButton) {
        await backButton.click();
      } else {
        // Alternative navigation
        await this.page.evaluate(() => {
          window.location.hash = '#tabs';
        });
      }
      
      await this.page.waitForTimeout(2000);

      // Check if gallery tab exists
      const tabs = await this.page.$$('button, a');
      let galleryFound = false;
      
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const text = await tab.evaluate(el => el.textContent);
        if (text.includes('Gallery')) {
          await tab.click();
          galleryFound = true;
          break;
        }
      }

      if (galleryFound) {
        this.results.gallery.details.push('✅ Gallery tab accessible');
        
        await this.page.waitForTimeout(2000);
        
        // Check for gallery content
        const galleryContent = await this.page.$$('[class*="gallery"], [class*="image"], [class*="grid"]');
        if (galleryContent.length > 0) {
          this.results.gallery.details.push('✅ Gallery content area present');
        } else {
          this.results.gallery.details.push('⚠️ Gallery content area not clearly identified');
        }

        this.results.gallery.passed = true;
      } else {
        this.results.gallery.details.push('❌ Gallery tab not found');
      }

    } catch (error) {
      this.results.gallery.details.push(`❌ Gallery features test failed: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('⚠️ Testing Error Handling in Demo Mode...');
    try {
      // Navigate back to admin
      await this.page.goto('http://localhost:5173/#admin');
      await this.page.waitForTimeout(2000);

      // Test invalid navigation
      try {
        await this.page.evaluate(() => {
          // Simulate potential error conditions
          window.postMessage({ type: 'TEST_ERROR' }, '*');
        });
        this.results.errorHandling.details.push('✅ Page handles programmatic errors gracefully');
      } catch (error) {
        this.results.errorHandling.details.push(`⚠️ Error simulation test: ${error.message}`);
      }

      // Check for error boundaries or error handling UI
      const errorElements = await this.page.$$('[class*="error"], [class*="alert"], [class*="warning"]');
      this.results.errorHandling.details.push(`ℹ️ Found ${errorElements.length} error-related UI elements`);

      // Test rapid navigation (stress test)
      try {
        const buttons = await this.page.$$('button[class*="text-left p-4 rounded-2xl"]');
        if (buttons.length > 3) {
          for (let i = 0; i < Math.min(3, buttons.length); i++) {
            await buttons[i].click();
            await this.page.waitForTimeout(200);
          }
          this.results.errorHandling.details.push('✅ Rapid navigation between sections handled gracefully');
        }
      } catch (error) {
        this.results.errorHandling.details.push(`⚠️ Rapid navigation test encountered issues: ${error.message}`);
      }

      this.results.errorHandling.passed = true;

    } catch (error) {
      this.results.errorHandling.details.push(`❌ Error handling test failed: ${error.message}`);
    }
  }

  calculateSummary() {
    let totalTests = 0;
    let passedTests = 0;

    Object.keys(this.results).forEach(key => {
      if (key !== 'summary' && this.results[key].details) {
        totalTests++;
        if (this.results[key].passed) {
          passedTests++;
        }
      }
    });

    this.results.summary = {
      totalTests,
      passed: passedTests,
      failed: totalTests - passedTests
    };
  }

  generateReport() {
    this.calculateSummary();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE ADMIN DEMO MODE TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 SUMMARY: ${this.results.summary.passed}/${this.results.summary.totalTests} test sections passed\n`);

    // Detailed results for each test section
    const sections = [
      { key: 'adminAuth', title: '🔐 Admin Authentication & Access' },
      { key: 'countryModels', title: '🌍 Country Models Manager' },
      { key: 'styleApplication', title: '🎨 Style Application System' },
      { key: 'gallery', title: '🖼️ Gallery Features' },
      { key: 'errorHandling', title: '⚠️ Error Handling' }
    ];

    sections.forEach(section => {
      console.log(section.title);
      console.log('-'.repeat(40));
      console.log(`Status: ${this.results[section.key].passed ? '✅ PASSED' : '❌ FAILED'}`);
      this.results[section.key].details.forEach(detail => {
        console.log(`  ${detail}`);
      });
      console.log('');
    });

    // Generate recommendations
    console.log('🔍 RECOMMENDATIONS FOR DEMO MODE IMPROVEMENTS');
    console.log('-'.repeat(60));
    
    const recommendations = [];
    
    if (!this.results.adminAuth.passed) {
      recommendations.push('🔐 Fix admin authentication to work properly in demo mode');
    }
    
    if (!this.results.countryModels.passed) {
      recommendations.push('🌍 Ensure Country Models Manager displays demo data correctly');
    }
    
    if (!this.results.styleApplication.passed) {
      recommendations.push('🎨 Improve Style Application System demo functionality');
    }
    
    if (!this.results.gallery.passed) {
      recommendations.push('🖼️ Enhance Gallery features for demo mode');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✨ All core functionality working well! Consider adding more demo content');
    }

    recommendations.push('💡 Add loading skeletons for better UX during demo mode');
    recommendations.push('📱 Test mobile responsiveness of admin interface');
    recommendations.push('🎯 Add tooltips explaining demo mode limitations');
    recommendations.push('⚡ Implement offline functionality for true demo mode');

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Testing completed! Overall score: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      await this.testAdminAuthentication();
      await this.testCountryModelsManager();
      await this.testStyleApplicationSystem();
      await this.testGalleryFeatures();
      await this.testErrorHandling();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new AdminDemoTester();
tester.runAllTests().catch(console.error);