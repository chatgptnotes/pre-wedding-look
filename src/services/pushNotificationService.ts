import { supabase } from '../lib/supabase';
import { loggingService } from './loggingService';
import { analyticsService } from './analyticsService';

// Public VAPID key for push notifications
// In production, this should come from environment variables
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLmw4MXMhengxgqRXHh7JwLGqO6eiOKB7tS_Cf1P8pjP8ywcZKlKfJo';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  url?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  actions?: NotificationAction[];
  data?: Record<string, any>;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  private permissionStatus: NotificationPermission = 'default';

  constructor() {
    this.init();
  }

  /**
   * Initialize the push notification service
   */
  private async init(): Promise<void> {
    if (!this.isSupported) {
      loggingService.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      
      // Check current permission status
      this.permissionStatus = Notification.permission;
      
      // Get existing subscription if any
      this.subscription = await this.registration.pushManager.getSubscription();
      
      // Track initialization
      await analyticsService.track('push_notifications_initialized', {
        is_supported: this.isSupported,
        permission_status: this.permissionStatus,
        has_subscription: !!this.subscription,
      });

      loggingService.info('Push notification service initialized', {
        supported: this.isSupported,
        permission: this.permissionStatus,
        hasSubscription: !!this.subscription,
      });
    } catch (error) {
      loggingService.error('Failed to initialize push notification service', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permissionStatus;
  }

  /**
   * Check if user has granted permission
   */
  hasPermission(): boolean {
    return this.permissionStatus === 'granted';
  }

  /**
   * Check if user has an active subscription
   */
  hasSubscription(): boolean {
    return !!this.subscription;
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      // Request permission
      this.permissionStatus = await Notification.requestPermission();
      
      // Track permission result
      await analyticsService.track('push_permission_requested', {
        permission_granted: this.permissionStatus === 'granted',
        permission_status: this.permissionStatus,
      });

      if (this.permissionStatus === 'granted') {
        // Auto-subscribe if permission granted
        await this.subscribe();
        return true;
      }

      return false;
    } catch (error) {
      loggingService.error('Failed to request push notification permission', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported || !this.registration || this.permissionStatus !== 'granted') {
      return false;
    }

    try {
      // Create subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      this.subscription = subscription as any;

      // Save subscription to database
      await this.saveSubscription(subscription);

      // Track subscription
      await analyticsService.track('push_notifications_subscribed', {
        endpoint: subscription.endpoint,
      });

      loggingService.info('Push notification subscription created', {
        endpoint: subscription.endpoint,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to subscribe to push notifications', error);
      await analyticsService.track('push_notifications_subscribe_failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      // Unsubscribe from browser
      await this.subscription.unsubscribe();
      
      // Remove from database
      await this.removeSubscription();
      
      this.subscription = null;

      // Track unsubscription
      await analyticsService.track('push_notifications_unsubscribed');

      loggingService.info('Push notification subscription removed');
      return true;
    } catch (error) {
      loggingService.error('Failed to unsubscribe from push notifications', error);
      return false;
    }
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const subscriptionData = {
      user_id: user.user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.getKey('p256dh') ? 
        btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : null,
      auth_key: subscription.getKey('auth') ? 
        btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : null,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      active: true,
    };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, { onConflict: 'endpoint' });

    if (error) {
      throw error;
    }
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscription(): Promise<void> {
    if (!this.subscription) return;

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('endpoint', this.subscription.endpoint);

    if (error) {
      loggingService.error('Failed to remove subscription from database', error);
    }
  }

  /**
   * Send a test notification (for testing purposes)
   */
  async sendTestNotification(): Promise<void> {
    if (!this.hasPermission()) {
      throw new Error('Push notification permission not granted');
    }

    const testNotification: NotificationPayload = {
      title: 'Style-Off Test',
      body: 'Push notifications are working! 🎉',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification',
      data: {
        url: '/',
        type: 'test',
      },
    };

    await this.showNotification(testNotification);
  }

  /**
   * Show a local notification
   */
  private async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      image: payload.image,
      tag: payload.tag,
      data: payload.data || {},
      actions: payload.actions,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      timestamp: Date.now(),
    };

    await this.registration.showNotification(payload.title, options);
    
    // Track local notification
    await analyticsService.track('local_notification_shown', {
      notification_tag: payload.tag,
      notification_title: payload.title,
    });
  }

  /**
   * Get notification templates for different scenarios
   */
  getNotificationTemplates(): Record<string, NotificationTemplate> {
    return {
      gameJoined: {
        id: 'game_joined',
        name: 'Game Joined',
        title: 'Someone joined your game! 🎮',
        body: 'A new player has joined your Style-Off game. Time to show your style!',
        actions: [
          { action: 'view_game', title: 'View Game', icon: '/icons/action-view.png' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        data: { url: '/blinddate' },
      },
      
      matchFound: {
        id: 'match_found',
        name: 'Match Found',
        title: 'You have a match! ✨',
        body: 'Someone matched with you in Style-Off! Check out your compatibility.',
        actions: [
          { action: 'view_match', title: 'View Match', icon: '/icons/action-heart.png' },
          { action: 'dismiss', title: 'Later' },
        ],
      },

      tournamentStarting: {
        id: 'tournament_starting',
        name: 'Tournament Starting',
        title: 'Daily Tournament starting soon! 🏆',
        body: 'The daily Style-Off tournament starts in 10 minutes. Join now!',
        actions: [
          { action: 'join_tournament', title: 'Join Now', icon: '/icons/action-trophy.png' },
          { action: 'dismiss', title: 'Maybe Later' },
        ],
        data: { url: '/tournament' },
      },

      streakReminder: {
        id: 'streak_reminder',
        name: 'Streak Reminder',
        title: "Don't break your streak! 🔥",
        body: "You haven't played Style-Off today. Keep your winning streak alive!",
        actions: [
          { action: 'play_now', title: 'Play Now', icon: '/icons/action-play.png' },
          { action: 'remind_later', title: 'Remind Later' },
        ],
        data: { url: '/blinddate' },
      },

      creditsLow: {
        id: 'credits_low',
        name: 'Credits Low',
        title: 'Credits running low 💎',
        body: 'You have less than 5 credits left. Get more to keep playing!',
        actions: [
          { action: 'buy_credits', title: 'Get Credits', icon: '/icons/action-credits.png' },
          { action: 'dismiss', title: 'Not Now' },
        ],
        data: { url: '/credits' },
      },

      dailyChallenge: {
        id: 'daily_challenge',
        name: 'Daily Challenge',
        title: 'New daily challenge available! 🌟',
        body: 'Complete today\'s style challenge for bonus credits and rewards.',
        actions: [
          { action: 'view_challenge', title: 'Take Challenge', icon: '/icons/action-star.png' },
          { action: 'dismiss', title: 'Skip Today' },
        ],
        data: { url: '/daily-challenge' },
      },
    };
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(template: string, delay: number, data?: Record<string, any>): Promise<void> {
    const templates = this.getNotificationTemplates();
    const notificationTemplate = templates[template];
    
    if (!notificationTemplate) {
      throw new Error(`Notification template '${template}' not found`);
    }

    // In a real implementation, you'd send this to your backend to schedule
    // For now, we'll use setTimeout for immediate scheduling
    setTimeout(async () => {
      const payload: NotificationPayload = {
        ...notificationTemplate,
        data: { ...notificationTemplate.data, ...data },
      };
      
      await this.showNotification(payload);
    }, delay);

    await analyticsService.track('notification_scheduled', {
      template,
      delay_ms: delay,
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: {
    gameUpdates?: boolean;
    tournaments?: boolean;
    dailyReminders?: boolean;
    streakReminders?: boolean;
    marketing?: boolean;
  }): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) return;

    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      loggingService.error('Failed to update notification preferences', error);
      throw error;
    }

    await analyticsService.track('notification_preferences_updated', preferences);
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      loggingService.error('Failed to get notification preferences', error);
      return null;
    }

    return data || {
      gameUpdates: true,
      tournaments: true,
      dailyReminders: false,
      streakReminders: true,
      marketing: false,
    };
  }

  /**
   * Utility function to convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Handle incoming push messages (called by service worker)
   */
  static handlePushMessage(event: any): void {
    // This would be called by the service worker
    // Implementation is in the service worker file
  }
}

export const pushNotificationService = new PushNotificationService();

// Export types
export type { NotificationPayload, NotificationAction, NotificationTemplate };