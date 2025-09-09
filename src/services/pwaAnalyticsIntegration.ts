import { analyticsService } from './analyticsService';
import { experimentService } from './experimentService';
import { pushNotificationService } from './pushNotificationService';
import { loggingService } from './loggingService';

/**
 * PWA Analytics Integration Service
 * Combines PWA features with analytics tracking and A/B testing
 */
class PWAAnalyticsIntegration {
  private isInitialized = false;
  private offlineEventsQueue: any[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;

    try {
      // Set up PWA event listeners
      this.setupPWAEventListeners();
      
      // Set up offline analytics queue
      this.setupOfflineAnalytics();
      
      // Set up A/B testing for PWA features
      this.setupPWAExperiments();
      
      // Track PWA capabilities
      await this.trackPWACapabilities();
      
      this.isInitialized = true;
      loggingService.info('PWA Analytics Integration initialized');
    } catch (error) {
      loggingService.error('Failed to initialize PWA Analytics Integration', error);
    }
  }

  private setupPWAEventListeners() {
    // Service Worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        this.handleServiceWorkerMessage(event);
      });

      // Track service worker installation
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          analyticsService.track('service_worker_registered', {
            scope: registration.scope,
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            active: !!registration.active,
          });

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            analyticsService.track('service_worker_update_found');
          });
        })
        .catch(error => {
          analyticsService.trackError(error, { context: 'service_worker_registration' });
        });
    }

    // App install events
    window.addEventListener('beforeinstallprompt', (event) => {
      analyticsService.track('pwa_install_prompt_shown', {
        platforms: (event as any).platforms,
      });
    });

    window.addEventListener('appinstalled', () => {
      analyticsService.track('pwa_installed_successfully');
      this.trackPWAUsagePatterns();
    });

    // Network status changes
    window.addEventListener('online', () => {
      analyticsService.track('network_online');
      this.flushOfflineEvents();
    });

    window.addEventListener('offline', () => {
      analyticsService.track('network_offline');
    });

    // Visibility changes (background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        analyticsService.track('app_foregrounded');
        this.trackEngagementResumption();
      } else {
        analyticsService.track('app_backgrounded');
      }
    });

    // Screen orientation changes
    if ('orientation' in screen) {
      screen.orientation.addEventListener('change', () => {
        analyticsService.track('orientation_changed', {
          orientation: screen.orientation.angle,
          type: screen.orientation.type,
        });
      });
    }
  }

  private setupOfflineAnalytics() {
    // Intercept analytics events when offline
    const originalTrack = analyticsService.track.bind(analyticsService);
    
    analyticsService.track = async (eventName: string, properties?: any, userProperties?: any) => {
      if (navigator.onLine) {
        return originalTrack(eventName, properties, userProperties);
      } else {
        // Queue event for later
        this.offlineEventsQueue.push({
          eventName,
          properties: { ...properties, queued_offline: true },
          userProperties,
          timestamp: new Date().toISOString(),
        });
        
        // Store in localStorage as backup
        this.persistOfflineEvents();
        
        loggingService.debug('Analytics event queued for offline sync', { eventName });
      }
    };
  }

  private async setupPWAExperiments() {
    try {
      // Experiment: Install prompt timing
      const installPromptVariant = await experimentService.getVariant('install_prompt_timing');
      if (installPromptVariant) {
        this.configureInstallPromptTiming(installPromptVariant);
      }

      // Experiment: Push notification opt-in strategy
      const pushNotifVariant = await experimentService.getVariant('push_notification_strategy');
      if (pushNotifVariant) {
        this.configurePushNotificationStrategy(pushNotifVariant);
      }

      // Experiment: Offline features promotion
      const offlineFeaturesVariant = await experimentService.getVariant('offline_features_promotion');
      if (offlineFeaturesVariant) {
        this.configureOfflineFeaturesPromotion(offlineFeaturesVariant);
      }

      loggingService.info('PWA experiments configured');
    } catch (error) {
      loggingService.error('Failed to setup PWA experiments', error);
    }
  }

  private async trackPWACapabilities() {
    const capabilities = {
      // Installation
      supports_install: 'beforeinstallprompt' in window,
      is_installed: window.matchMedia('(display-mode: standalone)').matches,
      
      // Service Worker
      supports_service_worker: 'serviceWorker' in navigator,
      
      // Push Notifications
      supports_push: 'PushManager' in window,
      notification_permission: Notification.permission,
      
      // Storage
      supports_storage_estimate: 'storage' in navigator && 'estimate' in navigator.storage,
      
      // Network
      supports_network_info: 'connection' in navigator,
      connection_type: (navigator as any).connection?.effectiveType,
      
      // Device
      is_mobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
      screen_size: `${screen.width}x${screen.height}`,
      pixel_ratio: window.devicePixelRatio,
      
      // Features
      supports_wake_lock: 'wakeLock' in navigator,
      supports_web_share: 'share' in navigator,
      supports_clipboard: 'clipboard' in navigator,
      supports_file_system_access: 'showOpenFilePicker' in window,
    };

    await analyticsService.track('pwa_capabilities_detected', capabilities);
    
    // Set user properties for segmentation
    await analyticsService.setUserProperties({
      device_type: capabilities.is_mobile ? 'mobile' : 'desktop',
      pwa_support_level: this.calculatePWASupportLevel(capabilities),
    });
  }

  private calculatePWASupportLevel(capabilities: any): string {
    let score = 0;
    
    if (capabilities.supports_install) score += 2;
    if (capabilities.supports_service_worker) score += 2;
    if (capabilities.supports_push) score += 1;
    if (capabilities.supports_web_share) score += 1;
    if (capabilities.supports_wake_lock) score += 1;
    
    if (score >= 6) return 'full';
    if (score >= 4) return 'good';
    if (score >= 2) return 'basic';
    return 'limited';
  }

  private configureInstallPromptTiming(variant: string) {
    switch (variant) {
      case 'immediate':
        // Show install prompt immediately
        this.scheduleInstallPrompt(0);
        break;
      case 'after_engagement':
        // Show after user engagement (e.g., after first game)
        this.scheduleInstallPromptAfterEngagement();
        break;
      case 'delayed':
        // Show after 30 seconds
        this.scheduleInstallPrompt(30000);
        break;
      default:
        // Control - no automatic prompt
        break;
    }
  }

  private configurePushNotificationStrategy(variant: string) {
    switch (variant) {
      case 'contextual':
        // Ask for permissions when user joins first game
        this.enableContextualPushPrompt();
        break;
      case 'upfront':
        // Ask immediately after app install/first visit
        this.enableUpfrontPushPrompt();
        break;
      case 'incentivized':
        // Offer reward for enabling notifications
        this.enableIncentivizedPushPrompt();
        break;
      default:
        // Control - no automatic prompt
        break;
    }
  }

  private configureOfflineFeaturesPromotion(variant: string) {
    switch (variant) {
      case 'banner':
        // Show banner highlighting offline features
        this.showOfflineFeaturesBanner();
        break;
      case 'modal':
        // Show modal when user goes offline for first time
        this.enableOfflineFeaturesModal();
        break;
      case 'gradual':
        // Gradually introduce offline features
        this.enableGradualOfflineIntroduction();
        break;
      default:
        // Control - no promotion
        break;
    }
  }

  // Event handlers
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'ANALYTICS_EVENT':
        // Service worker is sending an analytics event
        analyticsService.track(data.eventName, {
          ...data.properties,
          from_service_worker: true,
        });
        break;
        
      case 'CACHE_UPDATED':
        analyticsService.track('cache_updated', {
          cache_name: data.cacheName,
          size: data.size,
        });
        break;
        
      case 'OFFLINE_EVENT_SYNCED':
        analyticsService.track('offline_events_synced', {
          events_count: data.eventsCount,
        });
        break;
    }
  }

  private flushOfflineEvents() {
    if (this.offlineEventsQueue.length === 0) return;
    
    // Send queued events
    this.offlineEventsQueue.forEach(event => {
      analyticsService.track(event.eventName, event.properties, event.userProperties);
    });
    
    analyticsService.track('offline_events_flushed', {
      events_count: this.offlineEventsQueue.length,
    });
    
    this.offlineEventsQueue = [];
    this.clearPersistedOfflineEvents();
  }

  private persistOfflineEvents() {
    try {
      localStorage.setItem('offline_analytics_queue', JSON.stringify(this.offlineEventsQueue));
    } catch (error) {
      loggingService.error('Failed to persist offline events', error);
    }
  }

  private clearPersistedOfflineEvents() {
    try {
      localStorage.removeItem('offline_analytics_queue');
    } catch (error) {
      loggingService.error('Failed to clear persisted offline events', error);
    }
  }

  // PWA-specific tracking methods
  async trackInstallPromptResult(outcome: 'accepted' | 'dismissed') {
    await analyticsService.track('install_prompt_result', { outcome });
    await experimentService.trackEvent('install_prompt_timing', 'prompt_interaction', { outcome });
  }

  async trackPWAUsagePatterns() {
    // Track how PWA usage differs from web usage
    const usageMetrics = {
      session_start_method: window.matchMedia('(display-mode: standalone)').matches ? 'pwa_launch' : 'browser_navigation',
      supports_background_sync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offline_capable: 'serviceWorker' in navigator,
    };
    
    await analyticsService.track('pwa_usage_pattern', usageMetrics);
  }

  async trackEngagementResumption() {
    // Track when user returns to app from background
    const timeAway = Date.now() - (parseInt(sessionStorage.getItem('backgroundTime') || '0'));
    
    await analyticsService.track('engagement_resumed', {
      time_away_seconds: Math.round(timeAway / 1000),
      session_type: window.matchMedia('(display-mode: standalone)').matches ? 'pwa' : 'browser',
    });
  }

  // Install prompt scheduling
  private scheduleInstallPrompt(delay: number) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('show-install-prompt'));
      analyticsService.track('install_prompt_triggered', { trigger: 'scheduled', delay });
    }, delay);
  }

  private scheduleInstallPromptAfterEngagement() {
    const handleEngagement = () => {
      analyticsService.track('install_prompt_triggered', { trigger: 'after_engagement' });
      window.dispatchEvent(new CustomEvent('show-install-prompt'));
      window.removeEventListener('game_joined', handleEngagement);
    };
    
    window.addEventListener('game_joined', handleEngagement);
  }

  // Push notification strategies
  private enableContextualPushPrompt() {
    const handleGameJoin = () => {
      setTimeout(() => {
        this.showContextualPushPrompt();
      }, 5000); // 5 seconds after joining game
    };
    
    window.addEventListener('game_joined', handleGameJoin);
  }

  private enableUpfrontPushPrompt() {
    setTimeout(() => {
      this.showUpfrontPushPrompt();
    }, 3000); // 3 seconds after app load
  }

  private enableIncentivizedPushPrompt() {
    const handleFirstGameComplete = () => {
      this.showIncentivizedPushPrompt();
    };
    
    window.addEventListener('game_completed', handleFirstGameComplete, { once: true });
  }

  private async showContextualPushPrompt() {
    await analyticsService.track('push_prompt_shown', { strategy: 'contextual' });
    // Show contextual push prompt UI
  }

  private async showUpfrontPushPrompt() {
    await analyticsService.track('push_prompt_shown', { strategy: 'upfront' });
    // Show upfront push prompt UI
  }

  private async showIncentivizedPushPrompt() {
    await analyticsService.track('push_prompt_shown', { strategy: 'incentivized' });
    // Show incentivized push prompt UI
  }

  // Offline features promotion
  private showOfflineFeaturesBanner() {
    analyticsService.track('offline_features_banner_shown');
    // Show banner UI
  }

  private enableOfflineFeaturesModal() {
    const handleOffline = () => {
      analyticsService.track('offline_features_modal_shown');
      // Show modal UI
    };
    
    window.addEventListener('offline', handleOffline, { once: true });
  }

  private enableGradualOfflineIntroduction() {
    // Introduce offline features gradually over multiple sessions
    const sessionCount = parseInt(localStorage.getItem('session_count') || '0') + 1;
    localStorage.setItem('session_count', sessionCount.toString());
    
    if (sessionCount === 3) {
      analyticsService.track('offline_features_gradual_intro', { session: sessionCount });
      // Show first offline feature introduction
    }
  }

  // Public methods for manual tracking
  async trackPWAFeatureUsage(feature: string, action: string, properties?: any) {
    await analyticsService.track('pwa_feature_used', {
      feature,
      action,
      ...properties,
    });
  }

  async trackOfflineInteraction(interaction: string, properties?: any) {
    await analyticsService.track('offline_interaction', {
      interaction,
      is_offline: !navigator.onLine,
      ...properties,
    });
  }

  async trackInstallationJourney(step: string, properties?: any) {
    await analyticsService.track('installation_journey', {
      step,
      ...properties,
    });
    
    await experimentService.trackEvent('install_prompt_timing', step, properties);
  }
}

export const pwaAnalyticsIntegration = new PWAAnalyticsIntegration();

// Export for use in components
export default pwaAnalyticsIntegration;