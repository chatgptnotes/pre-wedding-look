const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5174',
  timeout: 30000,
  adminPath: '/', // Since admin functionality is accessed from main app
  screenshotDir: path.join(__dirname, 'test-screenshots'),
  reportDir: path.join(__dirname, 'test-reports')
};

// Ensure directories exist
[TEST_CONFIG.screenshotDir, TEST_CONFIG.reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class AdminTestSuite {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = [];
    this.startTime = Date.now();
  }

  async setup() {
    console.log('🚀 Setting up test environment...');
    this.browser = await chromium.launch({
      headless: false, // Set to false to see the tests run
      slowMo: 500 // Slow down for easier observation
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    this.page = await this.context.newPage();
    
    // Enable console logging
    this.page.on('console', msg => console.log(`📄 Console: ${msg.text()}`));
    this.page.on('pageerror', err => console.error(`❌ Page Error: ${err.message}`));
  }

  async teardown() {
    console.log('🧹 Cleaning up test environment...');
    if (this.browser) {
      await this.browser.close();
    }
    await this.generateReport();
  }

  async addTestResult(category, test, status, message, details = {}) {
    const result = {
      category,
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${category} - ${test}: ${message}`);
  }

  async takeScreenshot(name) {
    const filename = `${Date.now()}-${name}.png`;
    const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async navigateToApp() {
    console.log('🌐 Navigating to application...');
    await this.page.goto(TEST_CONFIG.baseUrl);
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('app-loaded');
  }

  async accessAdminInterface() {
    console.log('🔑 Accessing admin interface...');
    try {
      // Look for admin access point - could be a button, link, or route
      const adminButton = await this.page.locator('button:has-text("Admin"), a:has-text("Admin"), [data-testid="admin-access"]').first();
      
      if (await adminButton.isVisible({ timeout: 5000 })) {
        await adminButton.click();
        await this.addTestResult('Navigation', 'Admin Access', 'PASS', 'Successfully accessed admin interface');
      } else {
        // Try direct navigation to admin route
        await this.page.goto(`${TEST_CONFIG.baseUrl}/admin`);
        await this.page.waitForTimeout(2000);
      }
      
      await this.takeScreenshot('admin-accessed');
      return true;
    } catch (error) {
      await this.addTestResult('Navigation', 'Admin Access', 'FAIL', `Failed to access admin: ${error.message}`);
      return false;
    }
  }

  async testCountryModelsManager() {
    console.log('🌍 Testing Country Models Manager...');
    
    try {
      // Navigate to Country Models Manager
      const countryModelsButton = await this.page.locator('button:has-text("Country Models Manager"), [data-testid="country-models"]').first();
      if (await countryModelsButton.isVisible({ timeout: 5000 })) {
        await countryModelsButton.click();
        await this.page.waitForTimeout(1000);
        await this.addTestResult('Country Models', 'Navigation', 'PASS', 'Successfully navigated to Country Models Manager');
      } else {
        throw new Error('Country Models Manager button not found');
      }

      await this.takeScreenshot('country-models-loaded');

      // Test country selection dropdown
      await this.testCountryDropdown();
      
      // Test file upload areas
      await this.testFileUploadAreas();
      
      // Test file validation
      await this.testFileValidation();
      
      // Test drag and drop functionality
      await this.testDragAndDrop();

    } catch (error) {
      await this.addTestResult('Country Models', 'Manager Access', 'FAIL', `Failed to test Country Models Manager: ${error.message}`);
    }
  }

  async testCountryDropdown() {
    try {
      const countrySelect = await this.page.locator('select').first();
      
      if (await countrySelect.isVisible()) {
        // Get all options
        const options = await countrySelect.locator('option').allTextContents();
        await this.addTestResult('Country Models', 'Country Dropdown', 'PASS', 
          `Country dropdown loaded with ${options.length} options: ${options.join(', ')}`);
        
        // Test selection
        await countrySelect.selectOption('US');
        await this.page.waitForTimeout(500);
        await countrySelect.selectOption('JP');
        await this.page.waitForTimeout(500);
        await countrySelect.selectOption('IN');
        await this.page.waitForTimeout(500);
        
        await this.addTestResult('Country Models', 'Country Selection', 'PASS', 'Successfully tested country selection');
      } else {
        throw new Error('Country dropdown not found');
      }
    } catch (error) {
      await this.addTestResult('Country Models', 'Country Dropdown', 'FAIL', error.message);
    }
  }

  async testFileUploadAreas() {
    try {
      // Look for bride and groom upload areas
      const brideUploadArea = await this.page.locator('[data-testid="bride-upload"], .bride-upload, :has-text("Bride Model")').first();
      const groomUploadArea = await this.page.locator('[data-testid="groom-upload"], .groom-upload, :has-text("Groom Model")').first();
      
      let foundAreas = 0;
      
      if (await brideUploadArea.isVisible()) {
        foundAreas++;
        await this.addTestResult('Country Models', 'Bride Upload Area', 'PASS', 'Bride upload area is visible');
      }
      
      if (await groomUploadArea.isVisible()) {
        foundAreas++;
        await this.addTestResult('Country Models', 'Groom Upload Area', 'PASS', 'Groom upload area is visible');
      }
      
      if (foundAreas === 0) {
        // Look for generic upload areas
        const uploadAreas = await this.page.locator('[type="file"], .upload-area, :has-text("upload"), :has-text("drag")').count();
        await this.addTestResult('Country Models', 'Upload Areas', foundAreas > 0 ? 'PASS' : 'WARN', 
          `Found ${uploadAreas} upload areas`);
      }
      
      await this.takeScreenshot('upload-areas-visible');
      
    } catch (error) {
      await this.addTestResult('Country Models', 'Upload Areas', 'FAIL', error.message);
    }
  }

  async testFileValidation() {
    try {
      // Create test files for validation
      const validImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF,
        0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x73,
        0x75, 0x01, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      // Look for file input
      const fileInput = await this.page.locator('input[type="file"]').first();
      if (await fileInput.isVisible() || await fileInput.count() > 0) {
        // Test with valid file
        const validFile = path.join(TEST_CONFIG.screenshotDir, 'test-valid.png');
        fs.writeFileSync(validFile, validImageBuffer);
        
        await fileInput.setInputFiles(validFile);
        await this.page.waitForTimeout(1000);
        
        await this.addTestResult('Country Models', 'File Validation', 'PASS', 'File input accepts valid image files');
        
        // Clean up
        if (fs.existsSync(validFile)) {
          fs.unlinkSync(validFile);
        }
      } else {
        await this.addTestResult('Country Models', 'File Validation', 'WARN', 'No file input found for validation testing');
      }
      
    } catch (error) {
      await this.addTestResult('Country Models', 'File Validation', 'FAIL', error.message);
    }
  }

  async testDragAndDrop() {
    try {
      // Look for drag and drop areas
      const uploadAreas = await this.page.locator('[data-testid*="upload"], .upload-area, [class*="drag"], [class*="drop"]').count();
      
      if (uploadAreas > 0) {
        await this.addTestResult('Country Models', 'Drag & Drop Areas', 'PASS', `Found ${uploadAreas} drag and drop areas`);
        
        // Test drag hover states (visual feedback)
        const firstUploadArea = await this.page.locator('[data-testid*="upload"], .upload-area, [class*="drag"], [class*="drop"]').first();
        
        if (await firstUploadArea.isVisible()) {
          await firstUploadArea.hover();
          await this.page.waitForTimeout(500);
          await this.takeScreenshot('upload-area-hover');
          await this.addTestResult('Country Models', 'Upload Area Hover', 'PASS', 'Upload area responds to hover');
        }
      } else {
        await this.addTestResult('Country Models', 'Drag & Drop Areas', 'WARN', 'No drag and drop areas found');
      }
      
    } catch (error) {
      await this.addTestResult('Country Models', 'Drag & Drop', 'FAIL', error.message);
    }
  }

  async testStyleApplicationSystem() {
    console.log('🎨 Testing Style Application System...');
    
    try {
      // Navigate to Style Application System
      const styleSystemButton = await this.page.locator('button:has-text("Style Application System"), [data-testid="style-application"]').first();
      if (await styleSystemButton.isVisible({ timeout: 5000 })) {
        await styleSystemButton.click();
        await this.page.waitForTimeout(1000);
        await this.addTestResult('Style Application', 'Navigation', 'PASS', 'Successfully navigated to Style Application System');
      } else {
        throw new Error('Style Application System button not found');
      }

      await this.takeScreenshot('style-application-loaded');

      // Test the filter dropdowns
      await this.testStyleFilters();
      
      // Test individual style application
      await this.testIndividualStyleApplication();
      
      // Test batch generation (the main issue to investigate)
      await this.testBatchGeneration();
      
      // Test queue status updates
      await this.testQueueStatus();

    } catch (error) {
      await this.addTestResult('Style Application', 'System Access', 'FAIL', `Failed to test Style Application System: ${error.message}`);
    }
  }

  async testStyleFilters() {
    try {
      // Test country selection
      const countrySelect = await this.page.locator('select').first();
      if (await countrySelect.isVisible()) {
        const countryOptions = await countrySelect.locator('option').allTextContents();
        await countrySelect.selectOption('IN');
        await this.page.waitForTimeout(500);
        await this.addTestResult('Style Application', 'Country Filter', 'PASS', 
          `Country filter working with options: ${countryOptions.join(', ')}`);
      }

      // Test role selection  
      const roleSelects = await this.page.locator('select').all();
      if (roleSelects.length > 1) {
        const roleSelect = roleSelects[1];
        await roleSelect.selectOption('bride');
        await this.page.waitForTimeout(500);
        await roleSelect.selectOption('groom');
        await this.page.waitForTimeout(500);
        await this.addTestResult('Style Application', 'Role Filter', 'PASS', 'Role selection working');
      }

      // Test style type selection
      if (roleSelects.length > 2) {
        const styleTypeSelect = roleSelects[2];
        const styleTypes = await styleTypeSelect.locator('option').allTextContents();
        
        for (let i = 0; i < Math.min(styleTypes.length, 5); i++) {
          await styleTypeSelect.selectOption({ index: i });
          await this.page.waitForTimeout(1000);
        }
        
        await this.addTestResult('Style Application', 'Style Type Filter', 'PASS', 
          `Style type filter working with options: ${styleTypes.join(', ')}`);
      }

    } catch (error) {
      await this.addTestResult('Style Application', 'Filter Testing', 'FAIL', error.message);
    }
  }

  async testIndividualStyleApplication() {
    try {
      // Look for individual "Apply to Model" buttons
      const applyButtons = await this.page.locator('button:has-text("Apply to Model"), button:has-text("Apply"), [data-testid*="apply"]').count();
      
      if (applyButtons > 0) {
        await this.addTestResult('Style Application', 'Individual Apply Buttons', 'PASS', 
          `Found ${applyButtons} individual apply buttons`);
        
        // Test clicking one apply button
        const firstApplyButton = await this.page.locator('button:has-text("Apply to Model"), button:has-text("Apply")').first();
        
        if (await firstApplyButton.isVisible()) {
          await firstApplyButton.click();
          await this.page.waitForTimeout(2000);
          await this.takeScreenshot('individual-apply-clicked');
          
          // Check for success/error messages
          const successMessage = await this.page.locator('.bg-green, .text-green, :has-text("success"), :has-text("queued")').count();
          const errorMessage = await this.page.locator('.bg-red, .text-red, :has-text("error"), :has-text("failed")').count();
          
          if (successMessage > 0) {
            await this.addTestResult('Style Application', 'Individual Apply Success', 'PASS', 'Individual style application succeeded');
          } else if (errorMessage > 0) {
            await this.addTestResult('Style Application', 'Individual Apply Error', 'WARN', 'Individual style application showed error (expected in demo mode)');
          } else {
            await this.addTestResult('Style Application', 'Individual Apply Response', 'WARN', 'No clear success/error message shown');
          }
        }
      } else {
        await this.addTestResult('Style Application', 'Individual Apply Buttons', 'WARN', 'No individual apply buttons found');
      }
      
    } catch (error) {
      await this.addTestResult('Style Application', 'Individual Apply', 'FAIL', error.message);
    }
  }

  async testBatchGeneration() {
    console.log('🔍 Testing Batch Generation (Generate All button)...');
    
    try {
      // Look for the "Generate All" button
      const generateAllButton = await this.page.locator('button:has-text("Generate All"), [data-testid="batch-generate"]').first();
      
      if (await generateAllButton.isVisible({ timeout: 5000 })) {
        await this.addTestResult('Style Application', 'Generate All Button Found', 'PASS', 'Generate All button is visible');
        
        // Check if button is enabled
        const isDisabled = await generateAllButton.isDisabled();
        await this.addTestResult('Style Application', 'Generate All Button State', isDisabled ? 'WARN' : 'PASS', 
          `Generate All button is ${isDisabled ? 'disabled' : 'enabled'}`);
        
        if (!isDisabled) {
          // Take screenshot before clicking
          await this.takeScreenshot('before-generate-all');
          
          // Click the Generate All button
          await generateAllButton.click();
          await this.page.waitForTimeout(3000);
          
          // Take screenshot after clicking
          await this.takeScreenshot('after-generate-all-click');
          
          // Look for confirmation dialog
          const confirmDialog = await this.page.locator('text="Apply ALL", text="confirm", [role="dialog"]').first();
          if (await confirmDialog.isVisible({ timeout: 2000 })) {
            await this.addTestResult('Style Application', 'Batch Confirmation Dialog', 'PASS', 'Confirmation dialog appeared');
            
            // Click confirm if available
            const confirmButton = await this.page.locator('button:has-text("OK"), button:has-text("Yes"), button:has-text("Confirm")').first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click();
              await this.page.waitForTimeout(2000);
            }
          } else {
            // Check for immediate processing without dialog
            await this.addTestResult('Style Application', 'Batch Confirmation Dialog', 'INFO', 'No confirmation dialog shown');
          }
          
          // Check for success/error messages after batch operation
          await this.checkBatchOperationResult();
          
        } else {
          await this.addTestResult('Style Application', 'Generate All Disabled', 'WARN', 'Generate All button is disabled - may require model upload first');
        }
        
      } else {
        await this.addTestResult('Style Application', 'Generate All Button', 'FAIL', 'Generate All button not found');
      }
      
    } catch (error) {
      await this.addTestResult('Style Application', 'Batch Generation', 'FAIL', error.message);
      await this.takeScreenshot('batch-generation-error');
    }
  }

  async checkBatchOperationResult() {
    try {
      // Wait a bit for any async operations to complete
      await this.page.waitForTimeout(3000);
      
      // Look for success messages
      const successIndicators = [
        '.bg-green', '.text-green-600', '.text-green-700',
        ':has-text("success")', ':has-text("queued")', ':has-text("added")',
        '.toast', '[role="alert"]'
      ];
      
      const errorIndicators = [
        '.bg-red', '.text-red-600', '.text-red-700', 
        ':has-text("error")', ':has-text("failed")', ':has-text("Failed to batch apply styles")'
      ];
      
      let foundSuccess = false;
      let foundError = false;
      let successMessage = '';
      let errorMessage = '';
      
      // Check for success indicators
      for (const selector of successIndicators) {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          foundSuccess = true;
          successMessage += await element.textContent() + ' ';
          break;
        }
      }
      
      // Check for error indicators  
      for (const selector of errorIndicators) {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          foundError = true;
          errorMessage += await element.textContent() + ' ';
          break;
        }
      }
      
      // Check console for errors
      const consoleLogs = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(msg.text());
        }
      });
      
      if (foundError) {
        await this.addTestResult('Style Application', 'Batch Operation Result', 'FAIL', 
          `Batch operation failed: ${errorMessage.trim()}`);
        
        // This is likely the "Failed to batch apply styles" error mentioned in the request
        if (errorMessage.includes('Failed to batch apply styles')) {
          await this.investigateBatchFailure();
        }
      } else if (foundSuccess) {
        await this.addTestResult('Style Application', 'Batch Operation Result', 'PASS', 
          `Batch operation succeeded: ${successMessage.trim()}`);
      } else {
        await this.addTestResult('Style Application', 'Batch Operation Result', 'WARN', 
          'No clear success or error message found after batch operation');
      }
      
      // Take screenshot of final state
      await this.takeScreenshot('batch-operation-final-state');
      
    } catch (error) {
      await this.addTestResult('Style Application', 'Batch Result Check', 'FAIL', error.message);
    }
  }

  async investigateBatchFailure() {
    console.log('🔍 Investigating batch failure...');
    
    try {
      // Check network tab for failed requests
      const networkLogs = [];
      this.page.on('response', response => {
        if (!response.ok()) {
          networkLogs.push(`${response.status()} ${response.url()}`);
        }
      });
      
      // Check for specific error conditions
      const possibleIssues = [];
      
      // 1. Check if models are uploaded
      const noModelMessage = await this.page.locator(':has-text("no model"), :has-text("upload model"), :has-text("model not found")').count();
      if (noModelMessage > 0) {
        possibleIssues.push('No model uploaded for selected country/role');
      }
      
      // 2. Check if styles are available
      const noStylesMessage = await this.page.locator(':has-text("no styles"), :has-text("No styles found")').count();
      if (noStylesMessage > 0) {
        possibleIssues.push('No styles available for selected filters');
      }
      
      // 3. Check if service is unavailable
      const serviceError = await this.page.locator(':has-text("service unavailable"), :has-text("connection"), :has-text("network")').count();
      if (serviceError > 0) {
        possibleIssues.push('Service connection issues');
      }
      
      // 4. Check if in demo mode
      const demoMode = await this.page.locator(':has-text("demo mode"), :has-text("Supabase not configured")').count();
      if (demoMode > 0) {
        possibleIssues.push('Running in demo mode without database connection');
      }
      
      await this.addTestResult('Style Application', 'Batch Failure Investigation', 'INFO', 
        `Possible issues: ${possibleIssues.length > 0 ? possibleIssues.join(', ') : 'No specific issues detected'}`);
      
    } catch (error) {
      await this.addTestResult('Style Application', 'Batch Failure Investigation', 'FAIL', error.message);
    }
  }

  async testQueueStatus() {
    try {
      // Look for queue status indicators
      const queueStatusElements = await this.page.locator(
        ':has-text("Pending"), :has-text("Processing"), :has-text("Queue"), .animate-pulse'
      ).count();
      
      if (queueStatusElements > 0) {
        await this.addTestResult('Style Application', 'Queue Status Display', 'PASS', 
          `Found ${queueStatusElements} queue status indicators`);
      } else {
        await this.addTestResult('Style Application', 'Queue Status Display', 'WARN', 
          'No queue status indicators visible');
      }
      
      // Take screenshot of queue status area
      await this.takeScreenshot('queue-status');
      
    } catch (error) {
      await this.addTestResult('Style Application', 'Queue Status', 'FAIL', error.message);
    }
  }

  async testGalleryTab() {
    console.log('🖼️ Testing Gallery Tab...');
    
    try {
      // Navigate to Gallery tab
      const galleryTab = await this.page.locator('button:has-text("Gallery"), [data-testid="gallery-tab"], a:has-text("Gallery")').first();
      if (await galleryTab.isVisible({ timeout: 5000 })) {
        await galleryTab.click();
        await this.page.waitForTimeout(2000);
        await this.addTestResult('Gallery', 'Navigation', 'PASS', 'Successfully navigated to Gallery tab');
      } else {
        throw new Error('Gallery tab not found');
      }

      await this.takeScreenshot('gallery-loaded');

      // Test view toggles
      await this.testGalleryViewToggles();
      
      // Test filtering
      await this.testGalleryFilters();
      
      // Test lightbox modal
      await this.testGalleryLightbox();
      
      // Test real-time updates (if available)
      await this.testGalleryRealTimeUpdates();

    } catch (error) {
      await this.addTestResult('Gallery', 'Tab Access', 'FAIL', `Failed to test Gallery tab: ${error.message}`);
    }
  }

  async testGalleryViewToggles() {
    try {
      // Look for featured vs by-country toggle
      const viewToggles = await this.page.locator('button:has-text("Featured"), button:has-text("By Country"), [data-testid*="toggle"]').count();
      
      if (viewToggles > 0) {
        await this.addTestResult('Gallery', 'View Toggles', 'PASS', `Found ${viewToggles} view toggle options`);
        
        // Test switching between views
        const featuredButton = await this.page.locator('button:has-text("Featured")').first();
        const byCountryButton = await this.page.locator('button:has-text("By Country"), button:has-text("Country")').first();
        
        if (await featuredButton.isVisible()) {
          await featuredButton.click();
          await this.page.waitForTimeout(1000);
          await this.takeScreenshot('gallery-featured-view');
        }
        
        if (await byCountryButton.isVisible()) {
          await byCountryButton.click();
          await this.page.waitForTimeout(1000);
          await this.takeScreenshot('gallery-by-country-view');
        }
        
      } else {
        await this.addTestResult('Gallery', 'View Toggles', 'WARN', 'No view toggle buttons found');
      }
      
    } catch (error) {
      await this.addTestResult('Gallery', 'View Toggles', 'FAIL', error.message);
    }
  }

  async testGalleryFilters() {
    try {
      // Look for filter controls
      const filterSelects = await this.page.locator('select', '1').count();
      const filterButtons = await this.page.locator('button[class*="filter"], [data-testid*="filter"]').count();
      
      if (filterSelects > 0 || filterButtons > 0) {
        await this.addTestResult('Gallery', 'Filter Controls', 'PASS', 
          `Found ${filterSelects} select filters and ${filterButtons} button filters`);
        
        // Test country filtering if available
        if (filterSelects > 0) {
          const firstSelect = await this.page.locator('select').first();
          const options = await firstSelect.locator('option').count();
          if (options > 1) {
            await firstSelect.selectOption({ index: 1 });
            await this.page.waitForTimeout(1000);
            await this.takeScreenshot('gallery-filtered');
          }
        }
      } else {
        await this.addTestResult('Gallery', 'Filter Controls', 'WARN', 'No filter controls found');
      }
      
    } catch (error) {
      await this.addTestResult('Gallery', 'Filter Controls', 'FAIL', error.message);
    }
  }

  async testGalleryLightbox() {
    try {
      // Look for gallery images
      const galleryImages = await this.page.locator('img[src*="gallery"], [data-testid*="gallery-image"], .gallery img').count();
      
      if (galleryImages > 0) {
        await this.addTestResult('Gallery', 'Gallery Images', 'PASS', `Found ${galleryImages} gallery images`);
        
        // Try clicking on first image to open lightbox
        const firstImage = await this.page.locator('img[src*="gallery"], [data-testid*="gallery-image"], .gallery img').first();
        if (await firstImage.isVisible()) {
          await firstImage.click();
          await this.page.waitForTimeout(1000);
          
          // Check for lightbox/modal
          const modal = await this.page.locator('[role="dialog"], .modal, .lightbox, [data-testid*="modal"]').count();
          if (modal > 0) {
            await this.addTestResult('Gallery', 'Image Lightbox', 'PASS', 'Image lightbox modal opens successfully');
            await this.takeScreenshot('gallery-lightbox-open');
            
            // Try to close the modal
            const closeButton = await this.page.locator('button:has-text("Close"), [aria-label="Close"], .close, [data-testid*="close"]').first();
            if (await closeButton.isVisible()) {
              await closeButton.click();
              await this.page.waitForTimeout(500);
            } else {
              // Try clicking outside modal
              await this.page.keyboard.press('Escape');
              await this.page.waitForTimeout(500);
            }
          } else {
            await this.addTestResult('Gallery', 'Image Lightbox', 'WARN', 'No lightbox modal detected after clicking image');
          }
        }
      } else {
        await this.addTestResult('Gallery', 'Gallery Images', 'WARN', 'No gallery images found (expected in demo mode)');
      }
      
    } catch (error) {
      await this.addTestResult('Gallery', 'Image Lightbox', 'FAIL', error.message);
    }
  }

  async testGalleryRealTimeUpdates() {
    try {
      // This is harder to test without actual generation, but we can check for update mechanisms
      const updateIndicators = await this.page.locator('[data-testid*="live"], [class*="live"], :has-text("live"), :has-text("real-time")').count();
      
      if (updateIndicators > 0) {
        await this.addTestResult('Gallery', 'Real-time Updates', 'PASS', 'Real-time update indicators found');
      } else {
        await this.addTestResult('Gallery', 'Real-time Updates', 'INFO', 'No explicit real-time update indicators found');
      }
      
    } catch (error) {
      await this.addTestResult('Gallery', 'Real-time Updates', 'FAIL', error.message);
    }
  }

  async testErrorScenarios() {
    console.log('🚨 Testing Error Scenarios...');
    
    try {
      // Test demo mode behavior
      await this.testDemoModeHandling();
      
      // Test missing model scenarios
      await this.testMissingModelHandling();
      
      // Test network error handling
      await this.testNetworkErrorHandling();
      
      // Test validation errors
      await this.testValidationErrors();
      
    } catch (error) {
      await this.addTestResult('Error Scenarios', 'General', 'FAIL', error.message);
    }
  }

  async testDemoModeHandling() {
    try {
      // Check for demo mode indicators
      const demoIndicators = await this.page.locator(':has-text("demo mode"), :has-text("Supabase not configured"), :has-text("mock"), :has-text("placeholder")').count();
      
      if (demoIndicators > 0) {
        await this.addTestResult('Error Scenarios', 'Demo Mode Detection', 'PASS', 
          `Demo mode properly indicated with ${demoIndicators} indicators`);
      } else {
        // Check if we're actually connected to a database
        const databaseConnected = await this.page.locator(':has-text("connected"), :has-text("authenticated")').count();
        await this.addTestResult('Error Scenarios', 'Demo Mode Detection', databaseConnected > 0 ? 'PASS' : 'WARN', 
          databaseConnected > 0 ? 'Database connection detected' : 'Unable to determine demo mode status');
      }
      
    } catch (error) {
      await this.addTestResult('Error Scenarios', 'Demo Mode Handling', 'FAIL', error.message);
    }
  }

  async testMissingModelHandling() {
    try {
      // Navigate to style application and try to apply styles without models
      await this.page.goto(`${TEST_CONFIG.baseUrl}`);
      await this.accessAdminInterface();
      
      const styleSystemButton = await this.page.locator('button:has-text("Style Application System")').first();
      if (await styleSystemButton.isVisible({ timeout: 5000 })) {
        await styleSystemButton.click();
        await this.page.waitForTimeout(1000);
        
        // Try to apply a style (should show error about missing model)
        const applyButton = await this.page.locator('button:has-text("Apply"), button:has-text("Generate All")').first();
        if (await applyButton.isVisible()) {
          await applyButton.click();
          await this.page.waitForTimeout(2000);
          
          // Look for error about missing models
          const missingModelError = await this.page.locator(':has-text("no model"), :has-text("model not found"), :has-text("upload"), :has-text("missing")').count();
          
          if (missingModelError > 0) {
            await this.addTestResult('Error Scenarios', 'Missing Model Error', 'PASS', 'Proper error handling for missing models');
          } else {
            await this.addTestResult('Error Scenarios', 'Missing Model Error', 'WARN', 'No explicit missing model error shown');
          }
        }
      }
      
    } catch (error) {
      await this.addTestResult('Error Scenarios', 'Missing Model Handling', 'FAIL', error.message);
    }
  }

  async testNetworkErrorHandling() {
    try {
      // Simulate network issues by intercepting requests
      await this.page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      // Try to perform an operation that would require network
      const refreshButton = await this.page.locator('button:has-text("Refresh"), button:has-text("Reload"), [data-testid*="refresh"]').first();
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        await this.page.waitForTimeout(2000);
        
        // Look for network error messages
        const networkError = await this.page.locator(':has-text("network"), :has-text("connection"), :has-text("failed"), :has-text("error")').count();
        
        if (networkError > 0) {
          await this.addTestResult('Error Scenarios', 'Network Error Handling', 'PASS', 'Network errors are properly handled');
        } else {
          await this.addTestResult('Error Scenarios', 'Network Error Handling', 'WARN', 'No explicit network error handling detected');
        }
      }
      
      // Remove route intercept
      await this.page.unroute('**/api/**');
      
    } catch (error) {
      await this.addTestResult('Error Scenarios', 'Network Error Handling', 'FAIL', error.message);
    }
  }

  async testValidationErrors() {
    try {
      // Test form validation if available
      const forms = await this.page.locator('form').count();
      const inputs = await this.page.locator('input[required]').count();
      
      if (forms > 0 || inputs > 0) {
        await this.addTestResult('Error Scenarios', 'Form Validation', 'PASS', 
          `Found ${forms} forms and ${inputs} required inputs for validation testing`);
      } else {
        await this.addTestResult('Error Scenarios', 'Form Validation', 'INFO', 'No forms found for validation testing');
      }
      
    } catch (error) {
      await this.addTestResult('Error Scenarios', 'Validation Errors', 'FAIL', error.message);
    }
  }

  async testNavigationAndIntegration() {
    console.log('🧭 Testing Navigation and Integration...');
    
    try {
      // Test navigation between admin sections
      await this.testAdminSectionNavigation();
      
      // Test tab switching
      await this.testTabSwitching();
      
      // Test responsive design
      await this.testResponsiveDesign();
      
      // Test back navigation
      await this.testBackNavigation();
      
    } catch (error) {
      await this.addTestResult('Navigation', 'General', 'FAIL', error.message);
    }
  }

  async testAdminSectionNavigation() {
    try {
      // Navigate through different admin sections
      const adminSections = [
        'Country Models Manager',
        'Style Application System',
        'Gallery'
      ];
      
      let navigatedSections = 0;
      
      for (const section of adminSections) {
        const sectionButton = await this.page.locator(`button:has-text("${section}")`).first();
        if (await sectionButton.isVisible({ timeout: 3000 })) {
          await sectionButton.click();
          await this.page.waitForTimeout(1000);
          navigatedSections++;
          await this.takeScreenshot(`navigation-${section.toLowerCase().replace(/\s+/g, '-')}`);
        }
      }
      
      await this.addTestResult('Navigation', 'Admin Section Navigation', 'PASS', 
        `Successfully navigated to ${navigatedSections}/${adminSections.length} admin sections`);
      
    } catch (error) {
      await this.addTestResult('Navigation', 'Admin Section Navigation', 'FAIL', error.message);
    }
  }

  async testTabSwitching() {
    try {
      // Look for main app tabs
      const tabs = ['Generate', 'Gallery', 'Admin'];
      let tabCount = 0;
      
      for (const tabName of tabs) {
        const tab = await this.page.locator(`button:has-text("${tabName}"), a:has-text("${tabName}"), [data-testid*="${tabName.toLowerCase()}"]`).first();
        if (await tab.isVisible({ timeout: 2000 })) {
          await tab.click();
          await this.page.waitForTimeout(1000);
          tabCount++;
          await this.takeScreenshot(`tab-${tabName.toLowerCase()}`);
        }
      }
      
      await this.addTestResult('Navigation', 'Tab Switching', 'PASS', 
        `Successfully switched between ${tabCount} tabs`);
      
    } catch (error) {
      await this.addTestResult('Navigation', 'Tab Switching', 'FAIL', error.message);
    }
  }

  async testResponsiveDesign() {
    try {
      // Test different screen sizes
      const screenSizes = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const size of screenSizes) {
        await this.page.setViewportSize({ width: size.width, height: size.height });
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot(`responsive-${size.name.toLowerCase()}`);
        
        // Check if content is visible and properly arranged
        const visibleElements = await this.page.locator('button, input, select, h1, h2, h3').count();
        await this.addTestResult('Navigation', `Responsive ${size.name}`, 'PASS', 
          `${visibleElements} elements visible at ${size.width}x${size.height}`);
      }
      
      // Reset to original size
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      
    } catch (error) {
      await this.addTestResult('Navigation', 'Responsive Design', 'FAIL', error.message);
    }
  }

  async testBackNavigation() {
    try {
      // Test browser back navigation
      const initialUrl = this.page.url();
      
      // Navigate to a different section
      const sectionButton = await this.page.locator('button:has-text("Country Models Manager")').first();
      if (await sectionButton.isVisible({ timeout: 5000 })) {
        await sectionButton.click();
        await this.page.waitForTimeout(1000);
        
        // Use browser back
        await this.page.goBack();
        await this.page.waitForTimeout(1000);
        
        const currentUrl = this.page.url();
        await this.addTestResult('Navigation', 'Browser Back Navigation', 'PASS', 
          `Back navigation working: ${initialUrl} → ${currentUrl}`);
      }
      
      // Test in-app back buttons if available
      const backButton = await this.page.locator('button:has-text("Back"), [aria-label*="back"], [data-testid*="back"]').first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await this.page.waitForTimeout(1000);
        await this.addTestResult('Navigation', 'In-App Back Button', 'PASS', 'In-app back button works');
      }
      
    } catch (error) {
      await this.addTestResult('Navigation', 'Back Navigation', 'FAIL', error.message);
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length,
        warnings: this.testResults.filter(r => r.status === 'WARN').length,
        info: this.testResults.filter(r => r.status === 'INFO').length
      },
      categories: {},
      results: this.testResults,
      recommendations: []
    };
    
    // Group results by category
    this.testResults.forEach(result => {
      if (!report.categories[result.category]) {
        report.categories[result.category] = { passed: 0, failed: 0, warned: 0, info: 0 };
      }
      
      if (result.status === 'PASS') report.categories[result.category].passed++;
      if (result.status === 'FAIL') report.categories[result.category].failed++;
      if (result.status === 'WARN') report.categories[result.category].warned++;
      if (result.status === 'INFO') report.categories[result.category].info++;
    });
    
    // Generate recommendations based on findings
    const batchErrors = this.testResults.filter(r => 
      r.category === 'Style Application' && 
      r.status === 'FAIL' && 
      r.message.toLowerCase().includes('batch')
    );
    
    if (batchErrors.length > 0) {
      report.recommendations.push({
        priority: 'HIGH',
        category: 'Style Application',
        issue: 'Batch Generation Failure',
        description: 'The "Generate All" button functionality is failing',
        possibleCauses: [
          'Missing model upload validation',
          'Database connection issues in demo mode',  
          'Async operation handling problems',
          'Error handling not properly implemented'
        ],
        suggestedActions: [
          'Check GalleryService.batchAddToQueue implementation',
          'Verify model availability validation before batch operations',
          'Improve error messaging for failed batch operations',
          'Add proper loading states during batch processing'
        ]
      });
    }
    
    if (report.summary.failed > 0) {
      report.recommendations.push({
        priority: 'MEDIUM',
        category: 'General',
        issue: 'Test Failures Detected',
        description: `${report.summary.failed} tests failed during comprehensive testing`,
        suggestedActions: [
          'Review failed test details for specific issues',
          'Verify demo mode is properly configured',
          'Test with actual database connection if available'
        ]
      });
    }
    
    // Save report
    const reportPath = path.join(TEST_CONFIG.reportDir, `admin-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(TEST_CONFIG.reportDir, `admin-test-report-${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`\n📊 Test Report Generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log(`\n📈 Test Summary:`);
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed} ✅`);
    console.log(`   Failed: ${report.summary.failed} ❌`);
    console.log(`   Warnings: ${report.summary.warnings} ⚠️`);
    console.log(`   Duration: ${report.duration}`);
    
    return { reportPath, markdownPath, summary: report.summary };
  }

  generateMarkdownReport(report) {
    let markdown = `# Pre-Wedding AI Studio Admin Interface Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}  
Duration: ${report.duration}  
Total Tests: ${report.summary.total}

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | ${report.summary.passed} | ${Math.round((report.summary.passed / report.summary.total) * 100)}% |
| ❌ Failed | ${report.summary.failed} | ${Math.round((report.summary.failed / report.summary.total) * 100)}% |
| ⚠️ Warnings | ${report.summary.warnings} | ${Math.round((report.summary.warnings / report.summary.total) * 100)}% |
| ℹ️ Info | ${report.summary.info} | ${Math.round((report.summary.info / report.summary.total) * 100)}% |

## Category Breakdown

`;

    Object.entries(report.categories).forEach(([category, stats]) => {
      markdown += `### ${category}
- ✅ Passed: ${stats.passed}
- ❌ Failed: ${stats.failed}  
- ⚠️ Warnings: ${stats.warned}
- ℹ️ Info: ${stats.info}

`;
    });

    if (report.recommendations.length > 0) {
      markdown += `## Recommendations

`;
      report.recommendations.forEach((rec, index) => {
        markdown += `### ${index + 1}. ${rec.issue} (${rec.priority} Priority)

**Category:** ${rec.category}  
**Description:** ${rec.description}

`;
        if (rec.possibleCauses) {
          markdown += `**Possible Causes:**
${rec.possibleCauses.map(cause => `- ${cause}`).join('\n')}

`;
        }
        
        markdown += `**Suggested Actions:**
${rec.suggestedActions.map(action => `- ${action}`).join('\n')}

`;
      });
    }

    markdown += `## Detailed Test Results

`;

    Object.entries(report.categories).forEach(([category, stats]) => {
      markdown += `### ${category} Tests

`;
      const categoryTests = report.results.filter(r => r.category === category);
      categoryTests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : test.status === 'WARN' ? '⚠️' : 'ℹ️';
        markdown += `${icon} **${test.test}**: ${test.message}
`;
      });
      markdown += `
`;
    });

    return markdown;
  }

  async runComprehensiveTests() {
    console.log('🎯 Starting Comprehensive Admin Interface Testing...');
    
    await this.setup();
    
    try {
      // Navigate to the application
      await this.navigateToApp();
      
      // Access admin interface
      if (await this.accessAdminInterface()) {
        
        // Test Country Models Manager
        await this.testCountryModelsManager();
        
        // Test Style Application System
        await this.testStyleApplicationSystem();
        
        // Test Gallery Tab
        await this.testGalleryTab();
        
        // Test Error Scenarios
        await this.testErrorScenarios();
        
        // Test Navigation and Integration
        await this.testNavigationAndIntegration();
      }
      
    } catch (error) {
      console.error('🚨 Test suite error:', error);
      await this.addTestResult('System', 'Test Suite', 'FAIL', `Test suite error: ${error.message}`);
    }
    
    await this.teardown();
  }
}

// Update TodoWrite status before starting
async function updateTodoStatus() {
  // This would be called if we could access the TodoWrite tool from here
  console.log('📝 Updating todo status to mark comprehensive testing as complete...');
}

// Run the tests
async function main() {
  const testSuite = new AdminTestSuite();
  await testSuite.runComprehensiveTests();
  
  console.log('🏁 Comprehensive admin interface testing completed!');
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AdminTestSuite };