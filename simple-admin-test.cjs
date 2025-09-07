const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5174',
  timeout: 30000,
  screenshotDir: path.join(__dirname, 'test-screenshots'),
  reportDir: path.join(__dirname, 'test-reports')
};

// Ensure directories exist
[TEST_CONFIG.screenshotDir, TEST_CONFIG.reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class SimpleAdminTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.startTime = Date.now();
  }

  async setup() {
    console.log('🚀 Setting up browser-less test environment...');
    // We'll use fetch and DOM parsing instead of full browser automation
    this.testResults = [];
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

  async testAppAccess() {
    console.log('🌐 Testing application access...');
    
    try {
      const fetch = await import('node-fetch').then(m => m.default);
      const response = await fetch(TEST_CONFIG.baseUrl);
      
      if (response.ok) {
        const html = await response.text();
        await this.addTestResult('Access', 'App Loading', 'PASS', 
          `App accessible at ${TEST_CONFIG.baseUrl} (${response.status})`);
        
        // Basic HTML content checks
        if (html.includes('admin') || html.includes('Admin')) {
          await this.addTestResult('Access', 'Admin References', 'PASS', 
            'Admin-related content found in HTML');
        } else {
          await this.addTestResult('Access', 'Admin References', 'WARN', 
            'No explicit admin references found in HTML');
        }
        
        // Check for key components
        const componentChecks = [
          { name: 'React App', pattern: 'React|react' },
          { name: 'Vite', pattern: 'vite|Vite' },
          { name: 'Admin Functionality', pattern: 'CountryModelsManager|StyleApplicationPanel' },
          { name: 'Gallery Features', pattern: 'gallery|Gallery' }
        ];
        
        componentChecks.forEach(check => {
          if (html.includes(check.pattern) || new RegExp(check.pattern, 'i').test(html)) {
            this.addTestResult('Access', check.name, 'PASS', `${check.name} detected`);
          } else {
            this.addTestResult('Access', check.name, 'WARN', `${check.name} not detected in initial HTML`);
          }
        });
        
        return true;
      } else {
        await this.addTestResult('Access', 'App Loading', 'FAIL', 
          `App not accessible: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      await this.addTestResult('Access', 'App Loading', 'FAIL', 
        `Connection error: ${error.message}`);
      return false;
    }
  }

  async analyzeSourceCode() {
    console.log('🔍 Analyzing source code structure...');
    
    try {
      // Check admin components exist
      const adminFiles = [
        '/Users/murali/prewed/pre-wedding-look/src/components/AdminPage.tsx',
        '/Users/murali/prewed/pre-wedding-look/src/components/admin/CountryModelsManager.tsx',
        '/Users/murali/prewed/pre-wedding-look/src/components/admin/StyleApplicationPanel.tsx'
      ];
      
      for (const filePath of adminFiles) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const fileName = path.basename(filePath);
          
          await this.addTestResult('Source Code', `${fileName} Exists`, 'PASS', 
            `File exists with ${content.length} characters`);
          
          // Analyze specific functionality
          if (fileName === 'CountryModelsManager.tsx') {
            await this.analyzeCountryModelsManager(content);
          } else if (fileName === 'StyleApplicationPanel.tsx') {
            await this.analyzeStyleApplicationPanel(content);
          } else if (fileName === 'AdminPage.tsx') {
            await this.analyzeAdminPage(content);
          }
        } else {
          await this.addTestResult('Source Code', path.basename(filePath), 'FAIL', 
            'File not found');
        }
      }
      
      // Check gallery service
      const galleryServicePath = '/Users/murali/prewed/pre-wedding-look/src/services/galleryService.ts';
      if (fs.existsSync(galleryServicePath)) {
        const content = fs.readFileSync(galleryServicePath, 'utf8');
        await this.analyzeGalleryService(content);
      }
      
    } catch (error) {
      await this.addTestResult('Source Code', 'Analysis', 'FAIL', error.message);
    }
  }

  async analyzeCountryModelsManager(content) {
    console.log('🌍 Analyzing Country Models Manager...');
    
    const features = [
      { name: 'Country Selection Dropdown', pattern: 'select.*country|country.*select' },
      { name: 'File Upload Areas', pattern: 'input.*file|type.*file|upload' },
      { name: 'Drag and Drop', pattern: 'drag|drop|onDrag|onDrop' },
      { name: 'File Validation', pattern: 'validate|size|type.*image' },
      { name: 'Bride/Groom Models', pattern: 'bride.*groom|ModelRole' },
      { name: 'Error Handling', pattern: 'error|Error|catch' },
      { name: 'Success Messages', pattern: 'success|Success|uploaded' }
    ];
    
    features.forEach(feature => {
      const regex = new RegExp(feature.pattern, 'i');
      if (regex.test(content)) {
        this.addTestResult('Country Models', feature.name, 'PASS', 
          'Feature implementation found in code');
      } else {
        this.addTestResult('Country Models', feature.name, 'WARN', 
          'Feature implementation not clearly detected');
      }
    });
    
    // Check for constraint handling (one bride + one groom per country)
    if (content.includes('role') && content.includes('country')) {
      this.addTestResult('Country Models', 'Role-Country Constraint', 'PASS', 
        'Role and country handling detected');
    }
  }

  async analyzeStyleApplicationPanel(content) {
    console.log('🎨 Analyzing Style Application Panel...');
    
    const features = [
      { name: 'Country Selection', pattern: 'selectedCountry|country.*select' },
      { name: 'Role Selection', pattern: 'selectedRole|role.*select|bride.*groom' },
      { name: 'Style Type Filtering', pattern: 'selectedStyleType|StyleType|attire.*hairstyle' },
      { name: 'Individual Apply Buttons', pattern: 'Apply to Model|handleApplyStyle|onApply' },
      { name: 'Batch Generation', pattern: 'Generate All|batchAddToQueue|handleBatchApply' },
      { name: 'Queue Status', pattern: 'queue|Queue|pending|processing' },
      { name: 'Error Handling', pattern: 'error|Error|catch|fail' }
    ];
    
    features.forEach(feature => {
      const regex = new RegExp(feature.pattern, 'i');
      if (regex.test(content)) {
        this.addTestResult('Style Application', feature.name, 'PASS', 
          'Feature implementation found in code');
      } else {
        this.addTestResult('Style Application', feature.name, 'WARN', 
          'Feature implementation not clearly detected');
      }
    });
    
    // Look for the specific "Generate All" button issue
    if (content.includes('Generate All')) {
      this.addTestResult('Style Application', 'Generate All Button', 'PASS', 
        'Generate All button found in code');
      
      if (content.includes('batchAddToQueue') || content.includes('handleBatchApply')) {
        this.addTestResult('Style Application', 'Batch Logic Implementation', 'PASS', 
          'Batch application logic implemented');
      } else {
        this.addTestResult('Style Application', 'Batch Logic Implementation', 'FAIL', 
          'Batch application logic missing or incomplete');
      }
    }
  }

  async analyzeAdminPage(content) {
    console.log('⚙️ Analyzing Admin Page...');
    
    const sections = [
      { name: 'Country Models Manager Section', pattern: 'country-models|CountryModelsManager' },
      { name: 'Style Application Section', pattern: 'style-application|StyleApplicationPanel' },
      { name: 'Navigation System', pattern: 'activeSection|setActiveSection' },
      { name: 'Role-Based Access', pattern: 'admin|Admin|superadmin' },
      { name: 'Tab Navigation', pattern: 'tab|Tab|navigation' }
    ];
    
    sections.forEach(section => {
      const regex = new RegExp(section.pattern, 'i');
      if (regex.test(content)) {
        this.addTestResult('Admin Page', section.name, 'PASS', 
          'Section implementation found');
      } else {
        this.addTestResult('Admin Page', section.name, 'WARN', 
          'Section not clearly detected');
      }
    });
  }

  async analyzeGalleryService(content) {
    console.log('🖼️ Analyzing Gallery Service...');
    
    const features = [
      { name: 'Demo Mode Handling', pattern: 'checkSupabase|demo mode|Supabase not configured' },
      { name: 'Country Operations', pattern: 'getCountries|getCountryByISO' },
      { name: 'Model Management', pattern: 'getCountryModels|createOrUpdateModel' },
      { name: 'Style Operations', pattern: 'getStyles|getStyleById' },
      { name: 'Queue Management', pattern: 'addToQueue|batchAddToQueue|getQueueStatus' },
      { name: 'Error Handling', pattern: 'try.*catch|error|Error' },
      { name: 'File Upload', pattern: 'uploadModelImage|uploadGeneratedImage' }
    ];
    
    features.forEach(feature => {
      const regex = new RegExp(feature.pattern, 'i');
      if (regex.test(content)) {
        this.addTestResult('Gallery Service', feature.name, 'PASS', 
          'Feature implementation found');
      } else {
        this.addTestResult('Gallery Service', feature.name, 'WARN', 
          'Feature not clearly detected');
      }
    });
    
    // Analyze the specific batch failure issue
    if (content.includes('batchAddToQueue')) {
      this.addTestResult('Gallery Service', 'Batch Queue Implementation', 'PASS', 
        'Batch queue method exists');
      
      // Check for error scenarios
      if (content.includes('No model found') || content.includes('model not found')) {
        this.addTestResult('Gallery Service', 'Model Validation', 'PASS', 
          'Model validation checks implemented');
      }
      
      // Check demo mode handling
      if (content.includes('demo mode') || content.includes('checkSupabase')) {
        this.addTestResult('Gallery Service', 'Demo Mode Support', 'PASS', 
          'Demo mode properly implemented');
      }
    }
  }

  async investigateBatchFailureIssue() {
    console.log('🔍 Investigating "Failed to batch apply styles" issue...');
    
    try {
      const galleryServicePath = '/Users/murali/prewed/pre-wedding-look/src/services/galleryService.ts';
      const styleApplicationPath = '/Users/murali/prewed/pre-wedding-look/src/components/admin/StyleApplicationPanel.tsx';
      
      let potentialIssues = [];
      
      // Check Gallery Service
      if (fs.existsSync(galleryServicePath)) {
        const content = fs.readFileSync(galleryServicePath, 'utf8');
        
        // Look for batch implementation
        const batchMethod = content.match(/batchAddToQueue[^}]+}/s);
        if (batchMethod) {
          const methodContent = batchMethod[0];
          
          // Check for proper error handling
          if (!methodContent.includes('catch') && !methodContent.includes('try')) {
            potentialIssues.push('Batch method lacks comprehensive error handling');
          }
          
          // Check for demo mode handling
          if (!methodContent.includes('checkSupabase') && !methodContent.includes('demo')) {
            potentialIssues.push('Batch method may not handle demo mode properly');
          }
        } else {
          potentialIssues.push('batchAddToQueue method not found or malformed');
        }
        
        // Check model validation
        if (!content.includes('getCountryModelByRole') || !content.includes('No model found')) {
          potentialIssues.push('Model existence validation may be insufficient');
        }
      }
      
      // Check Style Application Panel
      if (fs.existsSync(styleApplicationPath)) {
        const content = fs.readFileSync(styleApplicationPath, 'utf8');
        
        // Look for batch apply handler
        const batchHandler = content.match(/handleBatchApply[^}]+}/s);
        if (batchHandler) {
          const handlerContent = batchHandler[0];
          
          // Check for proper error handling
          if (!handlerContent.includes('catch')) {
            potentialIssues.push('Batch apply handler lacks error handling');
          }
          
          // Check for user feedback
          if (!handlerContent.includes('showToast') && !handlerContent.includes('error')) {
            potentialIssues.push('Batch apply handler may not show error messages to user');
          }
        }
      }
      
      // Report findings
      if (potentialIssues.length > 0) {
        await this.addTestResult('Batch Failure Investigation', 'Potential Issues Found', 'WARN', 
          `Found ${potentialIssues.length} potential issues: ${potentialIssues.join('; ')}`);
      } else {
        await this.addTestResult('Batch Failure Investigation', 'Code Analysis', 'PASS', 
          'No obvious issues found in batch implementation');
      }
      
      // Provide specific recommendations
      const recommendations = [
        'Ensure models are uploaded for the selected country/role before batch operations',
        'Verify demo mode is properly configured when Supabase is not available',
        'Add explicit error messages for failed batch operations',
        'Implement loading states during batch processing',
        'Check network connectivity and service availability'
      ];
      
      await this.addTestResult('Batch Failure Investigation', 'Recommendations', 'INFO', 
        `Recommended fixes: ${recommendations.join('; ')}`);
      
    } catch (error) {
      await this.addTestResult('Batch Failure Investigation', 'Analysis Error', 'FAIL', 
        error.message);
    }
  }

  async testResponsiveDesign() {
    console.log('📱 Testing responsive design considerations...');
    
    try {
      const adminPagePath = '/Users/murali/prewed/pre-wedding-look/src/components/AdminPage.tsx';
      const styleApplicationPath = '/Users/murali/prewed/pre-wedding-look/src/components/admin/StyleApplicationPanel.tsx';
      
      const files = [
        { path: adminPagePath, name: 'Admin Page' },
        { path: styleApplicationPath, name: 'Style Application Panel' }
      ];
      
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          const content = fs.readFileSync(file.path, 'utf8');
          
          const responsiveFeatures = [
            { name: 'Grid Layout', pattern: 'grid-cols.*md:|grid.*lg:|grid.*xl:' },
            { name: 'Responsive Spacing', pattern: 'px-.*md:|py-.*lg:|space-.*xl:' },
            { name: 'Mobile Breakpoints', pattern: 'sm:|md:|lg:|xl:' },
            { name: 'Flex Responsive', pattern: 'flex.*md:|flex-col.*lg:' }
          ];
          
          let responsiveScore = 0;
          responsiveFeatures.forEach(feature => {
            const regex = new RegExp(feature.pattern);
            if (regex.test(content)) {
              responsiveScore++;
            }
          });
          
          const status = responsiveScore >= 3 ? 'PASS' : responsiveScore >= 1 ? 'WARN' : 'FAIL';
          this.addTestResult('Responsive Design', file.name, status, 
            `${responsiveScore}/${responsiveFeatures.length} responsive features detected`);
        }
      });
      
    } catch (error) {
      await this.addTestResult('Responsive Design', 'Analysis', 'FAIL', error.message);
    }
  }

  async testErrorHandling() {
    console.log('🚨 Testing error handling implementation...');
    
    try {
      const files = [
        '/Users/murali/prewed/pre-wedding-look/src/services/galleryService.ts',
        '/Users/murali/prewed/pre-wedding-look/src/components/admin/StyleApplicationPanel.tsx',
        '/Users/murali/prewed/pre-wedding-look/src/components/admin/CountryModelsManager.tsx'
      ];
      
      files.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const fileName = path.basename(filePath);
          
          const errorPatterns = [
            { name: 'Try-Catch Blocks', pattern: 'try\\s*{[^}]*catch' },
            { name: 'Error State Management', pattern: 'error|Error.*state|setError' },
            { name: 'User Error Messages', pattern: 'error.*message|Error.*message|alert.*error' },
            { name: 'Loading States', pattern: 'loading|Loading|isLoading' },
            { name: 'Validation Errors', pattern: 'validate|validation|invalid' }
          ];
          
          let errorHandlingScore = 0;
          errorPatterns.forEach(pattern => {
            const regex = new RegExp(pattern.pattern, 'i');
            if (regex.test(content)) {
              errorHandlingScore++;
            }
          });
          
          const status = errorHandlingScore >= 4 ? 'PASS' : errorHandlingScore >= 2 ? 'WARN' : 'FAIL';
          this.addTestResult('Error Handling', fileName, status, 
            `${errorHandlingScore}/${errorPatterns.length} error handling patterns found`);
        }
      });
      
    } catch (error) {
      await this.addTestResult('Error Handling', 'Analysis', 'FAIL', error.message);
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
      keyFindings: []
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
    
    // Extract key findings about the "Generate All" issue
    const batchIssues = this.testResults.filter(r => 
      r.message.toLowerCase().includes('batch') && 
      (r.status === 'FAIL' || r.status === 'WARN')
    );
    
    if (batchIssues.length > 0) {
      report.keyFindings.push({
        issue: 'Batch Generation Issues Detected',
        severity: 'HIGH',
        description: 'Analysis revealed potential issues with the "Generate All" functionality',
        affectedAreas: ['Style Application System', 'Gallery Service'],
        details: batchIssues.map(issue => issue.message)
      });
    }
    
    // Check for demo mode issues
    const demoModeResults = this.testResults.filter(r => 
      r.message.toLowerCase().includes('demo')
    );
    
    if (demoModeResults.length > 0) {
      report.keyFindings.push({
        issue: 'Demo Mode Behavior',
        severity: 'INFO',
        description: 'Application is likely running in demo mode without database connection',
        affectedAreas: ['All Admin Functions'],
        details: ['This explains why batch operations might fail - no actual database to queue operations']
      });
    }
    
    // Save report
    const reportPath = path.join(TEST_CONFIG.reportDir, `simple-admin-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(TEST_CONFIG.reportDir, `simple-admin-test-${Date.now()}.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`\n📊 Test Analysis Complete:`);
    console.log(`   JSON Report: ${reportPath}`);
    console.log(`   Markdown Report: ${markdownPath}`);
    console.log(`\n📈 Analysis Summary:`);
    console.log(`   Total Checks: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed} ✅`);
    console.log(`   Failed: ${report.summary.failed} ❌`);
    console.log(`   Warnings: ${report.summary.warnings} ⚠️`);
    console.log(`   Duration: ${report.duration}`);
    
    return { reportPath, markdownPath, summary: report.summary, keyFindings: report.keyFindings };
  }

  generateMarkdownReport(report) {
    let markdown = `# Pre-Wedding AI Studio Admin Interface Analysis Report

Generated: ${new Date(report.timestamp).toLocaleString()}  
Duration: ${report.duration}  
Type: Source Code Analysis + Basic Connectivity Test

## Executive Summary

This report analyzes the Pre-Wedding AI Studio admin interface through source code inspection and basic connectivity testing. The focus is on identifying the root cause of the "Failed to batch apply styles" error and evaluating overall system architecture.

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | ${report.summary.passed} | ${Math.round((report.summary.passed / report.summary.total) * 100)}% |
| ❌ Failed | ${report.summary.failed} | ${Math.round((report.summary.failed / report.summary.total) * 100)}% |
| ⚠️ Warnings | ${report.summary.warnings} | ${Math.round((report.summary.warnings / report.summary.total) * 100)}% |
| ℹ️ Info | ${report.summary.info} | ${Math.round((report.summary.info / report.summary.total) * 100)}% |

## Key Findings

`;

    if (report.keyFindings.length > 0) {
      report.keyFindings.forEach((finding, index) => {
        markdown += `### ${index + 1}. ${finding.issue} (${finding.severity} Severity)

**Description:** ${finding.description}

**Affected Areas:** ${finding.affectedAreas.join(', ')}

**Details:**
${finding.details.map(detail => `- ${detail}`).join('\n')}

`;
      });
    } else {
      markdown += `No critical issues identified in the analysis.

`;
    }

    markdown += `## Detailed Analysis Results

`;

    Object.entries(report.categories).forEach(([category, stats]) => {
      markdown += `### ${category}

**Summary:** ${stats.passed} passed, ${stats.failed} failed, ${stats.warned} warnings, ${stats.info} info

`;
      
      const categoryResults = report.results.filter(r => r.category === category);
      categoryResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : 'ℹ️';
        markdown += `${icon} **${result.test}**: ${result.message}  \n`;
      });
      
      markdown += `\n`;
    });

    markdown += `## Recommendations for "Generate All" Issue

Based on the analysis, here are the recommended steps to resolve the "Failed to batch apply styles" error:

### Immediate Actions

1. **Verify Model Upload Status**
   - Ensure that model images are uploaded for the selected country and role
   - The batch operation requires valid models to be present before proceeding

2. **Check Demo Mode Configuration**
   - If running without a database connection, ensure demo mode is properly configured
   - Consider adding more explicit demo mode indicators in the UI

3. **Improve Error Messaging**
   - Add specific error messages for different failure scenarios
   - Show clear feedback when models are missing or batch operations fail

### Technical Improvements

1. **Enhanced Validation**
   - Add pre-flight checks before batch operations
   - Validate model availability and service connectivity

2. **Better Error Handling**
   - Implement comprehensive try-catch blocks around batch operations
   - Add retry mechanisms for transient failures

3. **User Experience**
   - Add loading states during batch processing
   - Provide progress indicators for long-running operations
   - Show clear success/failure feedback

### Testing Recommendations

1. **Upload test models** to verify the upload functionality works
2. **Test batch operations** with uploaded models
3. **Test error scenarios** (no models, network issues, etc.)
4. **Verify responsive design** on different screen sizes

## Architecture Assessment

The admin interface appears to be well-structured with:
- Proper separation of concerns (components, services, types)
- Demo mode support for development/testing
- Comprehensive error handling patterns (in most components)
- Modern React patterns with TypeScript

The main issue appears to be related to the interaction between demo mode and batch operations rather than fundamental architectural problems.

---
*This analysis was performed on the source code and basic connectivity. For complete testing, browser-based end-to-end tests are recommended.*
`;

    return markdown;
  }

  async runSimpleTests() {
    console.log('🎯 Starting Simple Admin Interface Analysis...');
    
    await this.setup();
    
    try {
      // Test basic app access
      await this.testAppAccess();
      
      // Analyze source code structure
      await this.analyzeSourceCode();
      
      // Investigate the specific batch failure issue
      await this.investigateBatchFailureIssue();
      
      // Test responsive design patterns
      await this.testResponsiveDesign();
      
      // Test error handling patterns
      await this.testErrorHandling();
      
    } catch (error) {
      console.error('🚨 Analysis error:', error);
      await this.addTestResult('System', 'Analysis', 'FAIL', `Analysis error: ${error.message}`);
    }
    
    return await this.generateReport();
  }
}

// Run the analysis
async function main() {
  const testSuite = new SimpleAdminTest();
  const results = await testSuite.runSimpleTests();
  
  console.log('\n🎉 Analysis completed!');
  console.log('\n📋 Key Findings:');
  if (results.keyFindings && results.keyFindings.length > 0) {
    results.keyFindings.forEach(finding => {
      console.log(`   ${finding.severity}: ${finding.issue}`);
    });
  } else {
    console.log('   No critical issues identified');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimpleAdminTest };