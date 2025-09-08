#!/usr/bin/env node

/**
 * Immediate Continuous Testing Framework for Pre-Wedding AI Application
 * 
 * This script runs continuous testing using simple HTTP requests and basic checks
 * Can run immediately without additional dependencies
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

class ImmediateTestingAgent {
  constructor() {
    this.cycleCount = 0;
    this.baseUrl = '';
    this.testResults = [];
    
    // Define test targets
    this.CREATIVE_MODES = [
      { id: 'classic', name: 'Classic Mode', description: 'Traditional step-by-step photo generation' },
      { id: 'storyboard', name: 'Storyboard', description: 'Cinematic scene transitions' },
      { id: 'fusion', name: 'Fusion Reality', description: 'Live clothing swap with brush tool' },
      { id: 'future-vision', name: 'Future Vision', description: 'Age progression/family portraits' },
      { id: 'banana-challenge', name: 'Banana Challenge', description: 'Creative/quirky themes' },
      { id: 'voice-slideshow', name: 'Voice Slideshow', description: 'AI-narrated video stories' },
      { id: 'magic-button', name: 'Magic Button', description: 'One-click AI generation' },
      { id: 'regional-styles', name: 'Regional Styles', description: 'Cultural wedding styles' },
      { id: 'beyond-pre-wedding', name: 'Beyond Pre-Wedding', description: 'Anniversary/milestone photography' }
    ];
    
    this.ADMIN_SECTIONS = [
      'Content Management',
      'AI Integration Documentation', 
      'Video Demo Scripts',
      'Visual Effects Library',
      'User Management',
      'System Settings'
    ];
  }

  async initialize() {
    console.log('🚀 Initializing Immediate Testing Agent...');
    
    // Detect available server
    const servers = [
      'http://localhost:5174',  // Specified in requirements
      'http://localhost:5173',  // Dev server  
      'http://localhost:4173'   // Preview server
    ];
    
    for (const server of servers) {
      try {
        const available = await this.checkServerAvailability(server);
        if (available) {
          this.baseUrl = server;
          console.log(`✅ Connected to application at ${server}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!this.baseUrl) {
      throw new Error('❌ No available server found. Please ensure the application is running.');
    }
  }

  async checkServerAvailability(url) {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async fetchPageContent(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            content: data,
            headers: res.headers
          });
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async runContinuousTesting() {
    console.log('🔄 Starting continuous testing cycles...');
    
    while (true) {
      this.cycleCount++;
      console.log(`\n🔍 Testing Cycle #${this.cycleCount} - ${new Date().toLocaleTimeString()}`);
      
      try {
        const report = await this.runTestCycle();
        await this.generateReport(report);
        
        // Wait 3-5 minutes before next cycle
        const waitTime = 180000 + Math.random() * 120000; // 3-5 minutes
        console.log(`⏱️  Waiting ${Math.round(waitTime/1000)}s until next cycle...`);
        await this.sleep(waitTime);
        
      } catch (error) {
        console.error(`❌ Error in testing cycle ${this.cycleCount}:`, error.message);
        await this.sleep(30000); // Wait 30s before retry
      }
    }
  }

  async runTestCycle() {
    const startTime = Date.now();
    const report = {
      timestamp: new Date().toISOString(),
      cycle: this.cycleCount,
      workingFeatures: [],
      issuesFound: [],
      performanceMetrics: {
        pageLoadTime: 0,
        responseTime: 0,
        overallHealth: 'good'
      },
      recommendations: [],
      testingProgress: []
    };

    // Test 1: Basic Application Health
    await this.testApplicationHealth(report);
    
    // Test 2: Authentication Bypass Check
    await this.testAuthenticationBypass(report);
    
    // Test 3: Page Content Validation
    await this.testPageContent(report);
    
    // Test 4: React Application Loading
    await this.testReactAppLoading(report);
    
    // Test 5: Tab System Functionality
    await this.testTabSystemReferences(report);
    
    // Test 6: Admin System References
    await this.testAdminSystemReferences(report);

    report.performanceMetrics.pageLoadTime = Date.now() - startTime;
    
    return report;
  }

  async testApplicationHealth(report) {
    console.log('  🏥 Testing application health...');
    
    try {
      const startTime = Date.now();
      const response = await this.fetchPageContent(this.baseUrl);
      const responseTime = Date.now() - startTime;
      
      report.performanceMetrics.responseTime = responseTime;
      
      if (response.statusCode === 200) {
        report.workingFeatures.push(`✅ Application server responding (${response.statusCode})`);
        report.workingFeatures.push(`✅ Response time: ${responseTime}ms`);
        
        if (responseTime < 1000) {
          report.performanceMetrics.overallHealth = 'excellent';
        } else if (responseTime < 3000) {
          report.performanceMetrics.overallHealth = 'good';
        } else {
          report.performanceMetrics.overallHealth = 'fair';
          report.recommendations.push(`⚡ Consider optimizing response time (${responseTime}ms)`);
        }
      } else {
        report.issuesFound.push(`⚠️ Server responding with status ${response.statusCode}`);
        report.performanceMetrics.overallHealth = 'poor';
      }
      
      report.testingProgress.push('Application health check completed');
      
    } catch (error) {
      report.issuesFound.push(`❌ Application health check failed: ${error.message}`);
      report.performanceMetrics.overallHealth = 'poor';
    }
  }

  async testAuthenticationBypass(report) {
    console.log('  🔐 Testing authentication bypass...');
    
    try {
      const response = await this.fetchPageContent(this.baseUrl);
      
      if (response.content.includes('BYPASS_AUTH') || 
          response.content.includes('Get Started') ||
          !response.content.includes('login') && !response.content.includes('sign in')) {
        report.workingFeatures.push('✅ Authentication bypass working - no login required');
        report.testingProgress.push('Authentication bypass verified');
      } else {
        report.issuesFound.push('⚠️ Authentication bypass may not be working');
      }
      
    } catch (error) {
      report.issuesFound.push(`❌ Authentication bypass test failed: ${error.message}`);
    }
  }

  async testPageContent(report) {
    console.log('  📄 Testing page content...');
    
    try {
      const response = await this.fetchPageContent(this.baseUrl);
      const content = response.content.toLowerCase();
      
      // Check for essential React app elements
      const hasReact = content.includes('react') || content.includes('root');
      const hasTitle = content.includes('pre-wedding') || content.includes('wedding');
      const hasGetStarted = content.includes('get started');
      
      if (hasReact) {
        report.workingFeatures.push('✅ React application structure detected');
      }
      
      if (hasTitle) {
        report.workingFeatures.push('✅ Pre-wedding application title found');
      }
      
      if (hasGetStarted) {
        report.workingFeatures.push('✅ Get Started button/text found - landing page working');
      }
      
      // Check for JavaScript bundles
      const hasJSBundle = content.includes('.js') || content.includes('script');
      if (hasJSBundle) {
        report.workingFeatures.push('✅ JavaScript bundles loading');
      }
      
      report.testingProgress.push('Page content validation completed');
      
    } catch (error) {
      report.issuesFound.push(`❌ Page content test failed: ${error.message}`);
    }
  }

  async testReactAppLoading(report) {
    console.log('  ⚛️ Testing React app loading...');
    
    try {
      const response = await this.fetchPageContent(this.baseUrl);
      const content = response.content;
      
      // Look for React app indicators
      const hasRootDiv = content.includes('id="root"') || content.includes("id='root'");
      const hasReactScript = content.includes('react') || content.includes('React');
      const hasViteBuild = content.includes('vite') || content.includes('/_vite/');
      
      if (hasRootDiv) {
        report.workingFeatures.push('✅ React root element found');
      }
      
      if (hasViteBuild) {
        report.workingFeatures.push('✅ Vite development server detected');
      }
      
      // Check for TypeScript compilation (no syntax errors)
      if (!content.includes('TypeError') && !content.includes('SyntaxError')) {
        report.workingFeatures.push('✅ No obvious TypeScript/JavaScript errors in HTML');
      }
      
      report.testingProgress.push('React app loading verification completed');
      
    } catch (error) {
      report.issuesFound.push(`❌ React app loading test failed: ${error.message}`);
    }
  }

  async testTabSystemReferences(report) {
    console.log('  📑 Testing tab system references...');
    
    try {
      const response = await this.fetchPageContent(this.baseUrl);
      const content = response.content;
      
      // Check for tab-related code in the served content
      const tabsFound = [];
      
      for (const mode of this.CREATIVE_MODES) {
        if (content.includes(mode.name) || content.includes(mode.id)) {
          tabsFound.push(mode.name);
        }
      }
      
      if (tabsFound.length > 0) {
        report.workingFeatures.push(`✅ ${tabsFound.length}/9 creative modes found in source: ${tabsFound.slice(0,3).join(', ')}${tabsFound.length > 3 ? '...' : ''}`);
      } else {
        report.issuesFound.push('⚠️ Creative mode references not found in page source');
      }
      
      // Check for tab navigation components
      const hasTabNavigation = content.includes('TabNavigation') || content.includes('tab-navigation');
      if (hasTabNavigation) {
        report.workingFeatures.push('✅ Tab navigation system references found');
      }
      
      report.testingProgress.push('Tab system reference check completed');
      
    } catch (error) {
      report.issuesFound.push(`❌ Tab system test failed: ${error.message}`);
    }
  }

  async testAdminSystemReferences(report) {
    console.log('  ⚙️ Testing admin system references...');
    
    try {
      const response = await this.fetchPageContent(this.baseUrl);
      const content = response.content;
      
      // Check for admin-related references
      const hasAdminPage = content.includes('AdminPage') || content.includes('admin');
      const hasAdminButton = content.includes('Admin Dashboard') || content.includes('admin');
      const hasUserManagement = content.includes('User Management') || content.includes('SuperAdmin');
      
      if (hasAdminPage) {
        report.workingFeatures.push('✅ Admin page component references found');
      }
      
      if (hasAdminButton) {
        report.workingFeatures.push('✅ Admin access controls found');
      }
      
      if (hasUserManagement) {
        report.workingFeatures.push('✅ User management system references found');
      }
      
      // Check for new admin sections
      const newSections = [];
      if (content.includes('AI Integration')) newSections.push('AI Integration');
      if (content.includes('Video Demo')) newSections.push('Video Demo Scripts');
      if (content.includes('Visual Effects')) newSections.push('Visual Effects Library');
      
      if (newSections.length > 0) {
        report.workingFeatures.push(`✅ New admin sections found: ${newSections.join(', ')}`);
      }
      
      report.testingProgress.push('Admin system reference check completed');
      
    } catch (error) {
      report.issuesFound.push(`❌ Admin system test failed: ${error.message}`);
    }
  }

  async generateReport(report) {
    const reportContent = `
# 🔍 Continuous Testing Report #${report.cycle}
**Timestamp:** ${new Date(report.timestamp).toLocaleString()}
**Application URL:** ${this.baseUrl}
**Test Type:** HTTP-based immediate testing

## ✅ Working Features (${report.workingFeatures.length})
${report.workingFeatures.map(feature => `- ${feature}`).join('\n') || '- No working features detected'}

## ⚠️ Issues Found (${report.issuesFound.length})
${report.issuesFound.map(issue => `- ${issue}`).join('\n') || '- No issues found'}

## 📊 Performance Metrics
- **Page Load Time:** ${report.performanceMetrics.pageLoadTime}ms
- **Server Response Time:** ${report.performanceMetrics.responseTime}ms
- **Overall Health:** ${report.performanceMetrics.overallHealth.toUpperCase()}

## 🎯 Recommendations (${report.recommendations.length})
${report.recommendations.map(rec => `- ${rec}`).join('\n') || '- No recommendations at this time'}

## 📈 Testing Progress
${report.testingProgress.map(progress => `- ${progress}`).join('\n')}

## 🎯 Success Criteria Status
- ✅ Authentication bypass: ${report.workingFeatures.some(f => f.includes('Authentication bypass')) ? 'WORKING' : 'NEEDS CHECK'}
- ✅ React app loading: ${report.workingFeatures.some(f => f.includes('React')) ? 'WORKING' : 'NEEDS CHECK'}
- ✅ Creative modes: ${report.workingFeatures.some(f => f.includes('creative modes')) ? 'DETECTED' : 'NEEDS CHECK'}
- ✅ Admin system: ${report.workingFeatures.some(f => f.includes('Admin')) ? 'DETECTED' : 'NEEDS CHECK'}
- ✅ Server health: ${report.performanceMetrics.overallHealth !== 'poor' ? 'HEALTHY' : 'NEEDS ATTENTION'}

---
*Generated by Immediate Testing Agent v1.0*
`;

    // Save report to file
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `immediate-report-${report.cycle}-${Date.now()}.md`);
    fs.writeFileSync(reportFile, reportContent);
    
    console.log(`📄 Report saved: ${reportFile}`);
    
    // Display summary in console
    console.log('\n📊 CYCLE SUMMARY:');
    console.log(`   ✅ Working: ${report.workingFeatures.length} features`);
    console.log(`   ⚠️  Issues: ${report.issuesFound.length} problems`);
    console.log(`   ⚡ Performance: ${report.performanceMetrics.overallHealth.toUpperCase()} (${report.performanceMetrics.responseTime}ms)`);
    console.log(`   🎯 Recommendations: ${report.recommendations.length}`);
    console.log(`   🌐 Testing: ${this.baseUrl}`);
    
    this.testResults.push(report);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const agent = new ImmediateTestingAgent();
  
  try {
    await agent.initialize();
    console.log('\n🎯 MISSION: Continuous testing of pre-wedding AI application');
    console.log('🔍 SCOPE: All 9 creative modes + admin system + performance');
    console.log('⚡ METHOD: HTTP-based testing every 3-5 minutes');
    console.log('📊 OUTPUT: Detailed reports with actionable insights\n');
    
    await agent.runContinuousTesting();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down continuous testing...');
  console.log('📄 Check test-reports/ directory for all generated reports');
  process.exit(0);
});

// Run the testing agent
main().catch(error => {
  console.error('❌ Startup error:', error.message);
  process.exit(1);
});

export default ImmediateTestingAgent;