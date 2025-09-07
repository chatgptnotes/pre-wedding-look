/**
 * Continuous Testing Framework for Pre-Wedding AI Photo Generation Application
 * 
 * This framework provides automated testing for all 9 creative modes, admin system,
 * and comprehensive application functionality testing.
 */
import { chromium, Browser, Page, BrowserContext, expect } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

interface TestReport {
  timestamp: string;
  cycle: number;
  workingFeatures: string[];
  issuesFound: string[];
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
  testingProgress: string[];
}

interface PerformanceMetrics {
  pageLoadTime: number;
  imageUploadTime?: number;
  apiResponseTime?: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CreativeMode {
  id: string;
  name: string;
  tabId: string;
  description: string;
}

class ContinuousTestingAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private cycleCount = 0;
  private baseUrl = '';
  
  private readonly CREATIVE_MODES: CreativeMode[] = [
    { id: 'classic', name: 'Classic Mode', tabId: 'classic', description: 'Traditional step-by-step photo generation' },
    { id: 'storyboard', name: 'Storyboard', tabId: 'storyboard', description: 'Cinematic scene transitions' },
    { id: 'fusion', name: 'Fusion Reality', tabId: 'fusion', description: 'Live clothing swap with brush tool' },
    { id: 'future-vision', name: 'Future Vision', tabId: 'future-vision', description: 'Age progression/family portraits' },
    { id: 'banana-challenge', name: 'Banana Challenge', tabId: 'banana-challenge', description: 'Creative/quirky themes' },
    { id: 'voice-slideshow', name: 'Voice Slideshow', tabId: 'voice-slideshow', description: 'AI-narrated video stories' },
    { id: 'magic-button', name: 'Magic Button', tabId: 'magic-button', description: 'One-click AI generation' },
    { id: 'regional-styles', name: 'Regional Styles', tabId: 'regional-styles', description: 'Cultural wedding styles' },
    { id: 'beyond-pre-wedding', name: 'Beyond Pre-Wedding', tabId: 'beyond-pre-wedding', description: 'Anniversary/milestone photography' }
  ];

  private readonly ADMIN_SECTIONS = [
    'Content Management',
    'AI Integration Documentation', 
    'Video Demo Scripts',
    'Visual Effects Library',
    'User Management',
    'System Settings'
  ];

  constructor() {
    this.detectAvailableServer();
  }

  private async detectAvailableServer(): Promise<void> {
    // Check which server is available
    const servers = [
      'http://localhost:5174',  // Specified in requirements
      'http://localhost:5173',  // Dev server
      'http://localhost:4173'   // Preview server
    ];
    
    for (const server of servers) {
      try {
        const response = await fetch(server);
        if (response.ok) {
          this.baseUrl = server;
          console.log(`✅ Connected to application at ${server}`);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('❌ No available server found. Please ensure the application is running.');
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Continuous Testing Agent...');
    
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'ContinuousTestingAgent/1.0'
    });
    
    this.page = await this.context.newPage();
    
    // Set up error logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser Console Error: ${msg.text()}`);
      }
    });
    
    this.page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });
  }

  async runContinuousTesting(): Promise<void> {
    console.log('🔄 Starting continuous testing cycles...');
    
    while (true) {
      this.cycleCount++;
      console.log(`\n🔍 Testing Cycle #${this.cycleCount} - ${new Date().toLocaleTimeString()}`);
      
      try {
        const report = await this.runTestCycle();
        await this.generateReport(report);
        await this.logProgress();
        
        // Wait 3-5 minutes before next cycle
        const waitTime = 180000 + Math.random() * 120000; // 3-5 minutes
        console.log(`⏱️  Waiting ${Math.round(waitTime/1000)}s until next cycle...`);
        await this.sleep(waitTime);
        
      } catch (error) {
        console.error(`❌ Error in testing cycle ${this.cycleCount}:`, error);
        await this.sleep(30000); // Wait 30s before retry
      }
    }
  }

  private async runTestCycle(): Promise<TestReport> {
    const startTime = Date.now();
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      cycle: this.cycleCount,
      workingFeatures: [],
      issuesFound: [],
      performanceMetrics: {
        pageLoadTime: 0,
        overallHealth: 'good'
      },
      recommendations: [],
      testingProgress: []
    };

    // Test 1: Application Accessibility & Auth Bypass
    await this.testApplicationAccessibility(report);
    
    // Test 2: Random Creative Modes (2-3 per cycle)
    await this.testRandomCreativeModes(report);
    
    // Test 3: Admin System (1-2 sections per cycle)  
    await this.testAdminSystem(report);
    
    // Test 4: UI/UX and Responsive Design
    await this.testUIResponsiveness(report);
    
    // Test 5: Performance Monitoring
    await this.testPerformance(report);
    
    // Test 6: Error Handling
    await this.testErrorBoundaries(report);

    report.performanceMetrics.pageLoadTime = Date.now() - startTime;
    
    return report;
  }

  private async testApplicationAccessibility(report: TestReport): Promise<void> {
    console.log('  🔐 Testing application accessibility and auth bypass...');
    
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      const startTime = Date.now();
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      report.performanceMetrics.pageLoadTime = loadTime;
      
      // Check if landing page loads without authentication
      const title = await this.page.title();
      const hasAuthBypass = await this.page.locator('text=Get Started').isVisible({ timeout: 5000 });
      
      if (hasAuthBypass) {
        report.workingFeatures.push('✅ Authentication bypass working - public access enabled');
        report.testingProgress.push('Auth bypass functionality verified');
      } else {
        report.issuesFound.push('⚠️ Authentication bypass not working - login required');
      }
      
      // Test navigation to tabs view
      await this.page.locator('text=Get Started').click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle');
      
      const tabsVisible = await this.page.locator('[role="tablist"], .tab-navigation').isVisible({ timeout: 5000 });
      
      if (tabsVisible) {
        report.workingFeatures.push('✅ Tab navigation accessible without authentication');
        report.testingProgress.push('Tab navigation verified');
      } else {
        report.issuesFound.push('⚠️ Tab navigation not loading properly');
      }
      
    } catch (error) {
      report.issuesFound.push(`❌ Application accessibility test failed: ${error}`);
    }
  }

  private async testRandomCreativeModes(report: TestReport): Promise<void> {
    console.log('  🎨 Testing random creative modes...');
    
    // Select 2-3 random modes for this cycle
    const modesToTest = this.shuffleArray([...this.CREATIVE_MODES]).slice(0, 2 + Math.floor(Math.random() * 2));
    
    for (const mode of modesToTest) {
      try {
        console.log(`    Testing ${mode.name}...`);
        
        if (!this.page) throw new Error('Page not initialized');
        
        // Navigate to the mode tab
        const tabSelector = `[data-tab="${mode.tabId}"], text="${mode.name}"`;
        await this.page.locator(tabSelector).first().click({ timeout: 10000 });
        await this.page.waitForTimeout(2000);
        
        // Check if mode content loads
        const modeContent = await this.page.locator('.tab-content, [role="tabpanel"]').isVisible({ timeout: 5000 });
        
        if (modeContent) {
          report.workingFeatures.push(`✅ ${mode.name} - Tab loads successfully`);
          
          // Test drag-and-drop functionality
          const hasFileUpload = await this.page.locator('input[type="file"], [data-testid="file-upload"]').count();
          if (hasFileUpload > 0) {
            report.workingFeatures.push(`✅ ${mode.name} - File upload functionality present`);
          }
          
          // Test for generation buttons
          const hasGenerateButton = await this.page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Start")').count();
          if (hasGenerateButton > 0) {
            report.workingFeatures.push(`✅ ${mode.name} - Generation controls available`);
          }
          
        } else {
          report.issuesFound.push(`⚠️ ${mode.name} - Content not loading properly`);
        }
        
        report.testingProgress.push(`${mode.name} functionality tested`);
        
      } catch (error) {
        report.issuesFound.push(`❌ ${mode.name} - Error: ${error}`);
      }
    }
  }

  private async testAdminSystem(report: TestReport): Promise<void> {
    console.log('  ⚙️ Testing admin system...');
    
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      // Look for admin button (should be visible since BYPASS_AUTH=true gives admin access)
      const adminButton = await this.page.locator('button:has-text("Admin"), [title*="Admin"]').first();
      const adminVisible = await adminButton.isVisible({ timeout: 5000 });
      
      if (adminVisible) {
        report.workingFeatures.push('✅ Admin access button visible');
        
        // Click admin button
        await adminButton.click();
        await this.page.waitForTimeout(2000);
        
        // Check admin sections
        const sections = this.shuffleArray([...this.ADMIN_SECTIONS]).slice(0, 2);
        
        for (const section of sections) {
          const sectionVisible = await this.page.locator(`text="${section}"`, { timeout: 3000 }).isVisible().catch(() => false);
          
          if (sectionVisible) {
            report.workingFeatures.push(`✅ Admin - ${section} section accessible`);
          } else {
            report.issuesFound.push(`⚠️ Admin - ${section} section not found`);
          }
        }
        
        report.testingProgress.push('Admin system accessibility tested');
        
      } else {
        report.issuesFound.push('⚠️ Admin system not accessible - button not visible');
      }
      
    } catch (error) {
      report.issuesFound.push(`❌ Admin system test failed: ${error}`);
    }
  }

  private async testUIResponsiveness(report: TestReport): Promise<void> {
    console.log('  📱 Testing UI responsiveness...');
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      try {
        if (!this.page) throw new Error('Page not initialized');
        
        await this.page.setViewportSize(viewport);
        await this.page.waitForTimeout(1000);
        
        // Check if UI elements are responsive
        const headerVisible = await this.page.locator('header, .header').isVisible({ timeout: 3000 });
        const navigationVisible = await this.page.locator('.tab-navigation, [role="tablist"]').isVisible({ timeout: 3000 });
        
        if (headerVisible && navigationVisible) {
          report.workingFeatures.push(`✅ Responsive design - ${viewport.name} (${viewport.width}x${viewport.height})`);
        } else {
          report.issuesFound.push(`⚠️ Responsive design issues on ${viewport.name}`);
        }
        
      } catch (error) {
        report.issuesFound.push(`❌ Responsive test failed for ${viewport.name}: ${error}`);
      }
    }
    
    // Reset to desktop
    await this.page?.setViewportSize({ width: 1920, height: 1080 });
    report.testingProgress.push('Responsive design tested across multiple viewports');
  }

  private async testPerformance(report: TestReport): Promise<void> {
    console.log('  ⚡ Testing performance metrics...');
    
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      // Test page load performance
      const startTime = Date.now();
      await this.page.reload({ waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      report.performanceMetrics.pageLoadTime = loadTime;
      
      if (loadTime < 3000) {
        report.performanceMetrics.overallHealth = 'excellent';
        report.workingFeatures.push(`✅ Excellent page load time: ${loadTime}ms`);
      } else if (loadTime < 5000) {
        report.performanceMetrics.overallHealth = 'good';  
        report.workingFeatures.push(`✅ Good page load time: ${loadTime}ms`);
      } else if (loadTime < 8000) {
        report.performanceMetrics.overallHealth = 'fair';
        report.recommendations.push(`⚡ Page load time could be improved: ${loadTime}ms`);
      } else {
        report.performanceMetrics.overallHealth = 'poor';
        report.issuesFound.push(`⚠️ Slow page load time: ${loadTime}ms`);
      }
      
      report.testingProgress.push('Performance metrics collected');
      
    } catch (error) {
      report.issuesFound.push(`❌ Performance test failed: ${error}`);
    }
  }

  private async testErrorBoundaries(report: TestReport): Promise<void> {
    console.log('  🛡️ Testing error boundaries...');
    
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      // Check for JavaScript errors in console
      const errors: string[] = [];
      this.page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      // Test navigation stability
      await this.page.locator('text=Get Started').click().catch(() => {});
      await this.page.waitForTimeout(1000);
      
      const pageResponds = await this.page.locator('body').isVisible({ timeout: 5000 });
      
      if (pageResponds && errors.length === 0) {
        report.workingFeatures.push('✅ Error boundaries working - no JavaScript errors');
      } else {
        report.issuesFound.push(`⚠️ JavaScript errors found: ${errors.join(', ')}`);
      }
      
      report.testingProgress.push('Error boundary testing completed');
      
    } catch (error) {
      report.issuesFound.push(`❌ Error boundary test failed: ${error}`);
    }
  }

  private async generateReport(report: TestReport): Promise<void> {
    const reportContent = `
# 🔍 Continuous Testing Report #${report.cycle}
**Timestamp:** ${new Date(report.timestamp).toLocaleString()}
**Application URL:** ${this.baseUrl}

## ✅ Working Features (${report.workingFeatures.length})
${report.workingFeatures.map(feature => `- ${feature}`).join('\n')}

## ⚠️ Issues Found (${report.issuesFound.length})
${report.issuesFound.map(issue => `- ${issue}`).join('\n')}

## 📊 Performance Metrics
- **Page Load Time:** ${report.performanceMetrics.pageLoadTime}ms
- **Overall Health:** ${report.performanceMetrics.overallHealth.toUpperCase()}
${report.performanceMetrics.imageUploadTime ? `- **Image Upload Time:** ${report.performanceMetrics.imageUploadTime}ms` : ''}
${report.performanceMetrics.apiResponseTime ? `- **API Response Time:** ${report.performanceMetrics.apiResponseTime}ms` : ''}

## 🎯 Recommendations (${report.recommendations.length})
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📈 Testing Progress
${report.testingProgress.map(progress => `- ${progress}`).join('\n')}

---
*Generated by Continuous Testing Agent v1.0*
`;

    // Save report to file
    const reportsDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportFile = path.join(reportsDir, `report-${report.cycle}-${Date.now()}.md`);
    await fs.writeFile(reportFile, reportContent);
    
    console.log(`📄 Report saved: ${reportFile}`);
    
    // Display summary in console
    console.log('\n📊 CYCLE SUMMARY:');
    console.log(`   ✅ Working: ${report.workingFeatures.length} features`);
    console.log(`   ⚠️  Issues: ${report.issuesFound.length} problems`);
    console.log(`   ⚡ Performance: ${report.performanceMetrics.overallHealth.toUpperCase()}`);
    console.log(`   🎯 Recommendations: ${report.recommendations.length}`);
  }

  private async logProgress(): Promise<void> {
    const progressFile = path.join(process.cwd(), 'testing-progress.log');
    const logEntry = `[${new Date().toISOString()}] Cycle ${this.cycleCount} completed - Testing continuous...\n`;
    await fs.appendFile(progressFile, logEntry);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up testing environment...');
    await this.context?.close();
    await this.browser?.close();
  }
}

// Main execution
async function main() {
  const agent = new ContinuousTestingAgent();
  
  try {
    await agent.initialize();
    await agent.runContinuousTesting();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await agent.cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down continuous testing...');
  process.exit(0);
});

export default ContinuousTestingAgent;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}