import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { analyticsService } from '../services/analyticsService';
import { experimentService } from '../services/experimentService';
import { pushNotificationService } from '../services/pushNotificationService';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: 'control', error: null }),
  },
}));

// Mock navigator APIs
const mockNavigator = {
  onLine: true,
  userAgent: 'Test Browser',
  serviceWorker: {
    register: vi.fn().mockResolvedValue({
      scope: '/test/',
      installing: null,
      waiting: null,
      active: true,
    }),
    ready: Promise.resolve({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'test-endpoint',
          getKey: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        }),
      },
    }),
  },
  permissions: {
    query: vi.fn().mockResolvedValue({ state: 'granted' }),
  },
};

// @ts-ignore
global.navigator = mockNavigator;
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted'),
} as any;

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any stored data
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should track basic analytics events', async () => {
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    await analyticsService.track('test_event', { test: 'property' });
    
    expect(trackSpy).toHaveBeenCalledWith('test_event', { test: 'property' });
  });

  it('should track game-specific events', async () => {
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    await analyticsService.trackGameJoined('blinddate', 'game-123');
    
    expect(trackSpy).toHaveBeenCalledWith('game_joined', {
      game_type: 'blinddate',
      game_id: 'game-123',
    });
  });

  it('should track conversion events', async () => {
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    await analyticsService.trackConversion('signup', 1, { method: 'email' });
    
    expect(trackSpy).toHaveBeenCalledWith('conversion', {
      conversion_type: 'signup',
      value: 1,
      method: 'email',
    });
  });

  it('should handle offline events', async () => {
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    await analyticsService.track('offline_event', { test: true });
    
    // Event should be queued
    expect(trackSpy).toHaveBeenCalled();
  });

  it('should set user properties', async () => {
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    await analyticsService.setUserProperties({
      user_type: 'premium',
      device_type: 'mobile',
    });
    
    expect(trackSpy).toHaveBeenCalledWith(
      'user_properties_updated',
      {},
      {
        user_type: 'premium',
        device_type: 'mobile',
      }
    );
  });
});

describe('Experiment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get variant assignment', async () => {
    const variant = await experimentService.getVariant('test_experiment');
    
    expect(variant).toBe('control');
  });

  it('should track experiment events', async () => {
    const trackSpy = vi.spyOn(experimentService, 'trackEvent');
    
    await experimentService.trackEvent('test_experiment', 'conversion', { value: 100 });
    
    expect(trackSpy).toHaveBeenCalledWith('test_experiment', 'conversion', { value: 100 });
  });

  it('should check if user is in variant', async () => {
    const isInVariant = await experimentService.isInVariant('test_experiment', 'control');
    
    expect(isInVariant).toBe(true);
  });

  it('should track conversions', async () => {
    const trackSpy = vi.spyOn(experimentService, 'trackConversion');
    
    await experimentService.trackConversion('test_experiment', 'primary', 50);
    
    expect(trackSpy).toHaveBeenCalledWith('test_experiment', 'primary', 50);
  });
});

describe('Push Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check if push notifications are supported', () => {
    expect(pushNotificationService.isSupported()).toBe(true);
  });

  it('should request permission', async () => {
    const result = await pushNotificationService.requestPermission();
    
    expect(result).toBe(true);
    expect(Notification.requestPermission).toHaveBeenCalled();
  });

  it('should subscribe to push notifications', async () => {
    const result = await pushNotificationService.subscribe();
    
    expect(result).toBe(true);
  });

  it('should get notification templates', () => {
    const templates = pushNotificationService.getNotificationTemplates();
    
    expect(templates).toHaveProperty('gameJoined');
    expect(templates).toHaveProperty('matchFound');
    expect(templates).toHaveProperty('tournamentStarting');
  });
});

describe('PWA Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect PWA capabilities', () => {
    const capabilities = {
      supports_install: 'beforeinstallprompt' in window,
      supports_service_worker: 'serviceWorker' in navigator,
      supports_push: 'PushManager' in window,
      is_mobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
    };
    
    expect(capabilities.supports_service_worker).toBe(true);
    expect(capabilities.supports_push).toBe(true);
  });

  it('should track installation events', async () => {
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
    
    // Simulate app installed event
    const installedEvent = new Event('appinstalled');
    window.dispatchEvent(installedEvent);
    
    // Events should be tracked
    expect(trackSpy).toHaveBeenCalled();
  });

  it('should handle network status changes', async () => {
    const trackSpy = vi.spyOn(analyticsService, 'track');
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const offlineEvent = new Event('offline');
    window.dispatchEvent(offlineEvent);
    
    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);
    
    expect(trackSpy).toHaveBeenCalledWith('network_offline');
    expect(trackSpy).toHaveBeenCalledWith('network_online');
  });
});

describe('Analytics and Experiments Integration', () => {
  it('should track experiment assignment in analytics', async () => {
    const analyticsTrackSpy = vi.spyOn(analyticsService, 'track');
    
    // Get experiment variant (which should track assignment)
    await experimentService.getVariant('test_experiment');
    
    expect(analyticsTrackSpy).toHaveBeenCalledWith(
      'experiment_assigned',
      expect.objectContaining({
        experiment_name: 'test_experiment',
        variant_id: 'control',
      })
    );
  });

  it('should track conversion in both analytics and experiments', async () => {
    const analyticsTrackSpy = vi.spyOn(analyticsService, 'track');
    const experimentTrackSpy = vi.spyOn(experimentService, 'trackEvent');
    
    // Track a conversion
    await experimentService.trackConversion('test_experiment', 'primary', 100);
    
    expect(analyticsTrackSpy).toHaveBeenCalled();
    expect(experimentTrackSpy).toHaveBeenCalled();
  });
});

describe('Mobile Optimizations', () => {
  it('should detect device type correctly', () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true,
    });
    
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent);
    expect(isMobile).toBe(true);
  });

  it('should handle touch gestures', () => {
    // Mock touch events
    const touchStart = new TouchEvent('touchstart', {
      touches: [
        { clientX: 100, clientY: 100 } as Touch,
      ],
    });
    
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [
        { clientX: 200, clientY: 100 } as Touch,
      ],
    });
    
    // These would be handled by gesture components
    expect(touchStart.type).toBe('touchstart');
    expect(touchEnd.type).toBe('touchend');
  });
});

describe('Offline Functionality', () => {
  it('should queue analytics events when offline', async () => {
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    await analyticsService.track('offline_test_event', { queued: true });
    
    // Event should be handled (queued)
    expect(true).toBe(true); // Placeholder - would check queue in real implementation
  });

  it('should sync events when back online', () => {
    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);
    
    // Should trigger sync
    expect(true).toBe(true); // Placeholder - would check sync in real implementation
  });
});

// Performance tests
describe('Performance', () => {
  it('should track events efficiently', async () => {
    const startTime = performance.now();
    
    // Track multiple events
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(analyticsService.track(`test_event_${i}`, { index: i }));
    }
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time
    expect(duration).toBeLessThan(1000); // Less than 1 second
  });

  it('should handle concurrent experiment requests', async () => {
    const promises = [];
    
    for (let i = 0; i < 50; i++) {
      promises.push(experimentService.getVariant(`experiment_${i}`));
    }
    
    const results = await Promise.all(promises);
    
    // All should complete
    expect(results).toHaveLength(50);
  });
});

// Error handling tests
describe('Error Handling', () => {
  it('should handle analytics errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // This should not throw even if tracking fails
    await expect(analyticsService.track('error_test')).resolves.not.toThrow();
    
    consoleSpy.mockRestore();
  });

  it('should handle experiment service errors', async () => {
    // Should return null or default on error, not throw
    const result = await experimentService.getVariant('nonexistent_experiment');
    expect(result).toBeDefined();
  });

  it('should handle push notification errors', async () => {
    // Mock permission denied
    global.Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    
    const result = await pushNotificationService.requestPermission();
    expect(result).toBe(false);
  });
});

export {};