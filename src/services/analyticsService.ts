import { supabase } from '../lib/supabase';
import { loggingService } from './loggingService';

// Event schema for type safety
export interface AnalyticsEvent {
  event_name: string;
  event_properties?: Record<string, any>;
  user_properties?: Record<string, any>;
  value?: number;
  timestamp?: string;
}

// User properties that can be set
export interface UserProperties {
  user_type?: 'free' | 'premium';
  signup_method?: 'email' | 'google' | 'guest';
  country?: string;
  city?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  subscription_status?: 'active' | 'expired' | 'trial';
  total_games_played?: number;
  credits_balance?: number;
  last_game_date?: string;
}

// Session information
interface SessionInfo {
  session_id: string;
  started_at: Date;
  device_type?: string;
  user_agent?: string;
  country_code?: string;
  city?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

class AnalyticsService {
  private sessionInfo: SessionInfo | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSession();
    this.setupEventListeners();
    this.startFlushInterval();
  }

  private initializeSession() {
    try {
      // Generate or restore session ID
      const existingSession = sessionStorage.getItem('analytics_session');
      const sessionId = existingSession ? JSON.parse(existingSession).session_id : this.generateSessionId();
      
      this.sessionInfo = {
        session_id: sessionId,
        started_at: new Date(),
        device_type: this.getDeviceType(),
        user_agent: navigator.userAgent,
        utm_source: this.getURLParam('utm_source'),
        utm_medium: this.getURLParam('utm_medium'),
        utm_campaign: this.getURLParam('utm_campaign'),
      };

      // Store session info
      sessionStorage.setItem('analytics_session', JSON.stringify({
        session_id: sessionId,
        started_at: this.sessionInfo.started_at.toISOString()
      }));

      // Get geographic info if available
      this.getGeographicInfo();
    } catch (error) {
      loggingService.error('Failed to initialize analytics session', error);
    }
  }

  private setupEventListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEvents(); // Flush queued events when back online
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility for session tracking
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.track('session_resumed');
      } else {
        this.track('session_paused');
      }
    });

    // Unload event for session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private startFlushInterval() {
    // Flush events every 10 seconds
    this.flushInterval = setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, 10000);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return /ipad|tablet/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private getURLParam(param: string): string | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || undefined;
  }

  private async getGeographicInfo() {
    try {
      // Try to get IP-based location (you might want to use a service like ipapi.co)
      const response = await fetch('https://ipapi.co/json/', { timeout: 5000 } as any);
      if (response.ok) {
        const data = await response.json();
        if (this.sessionInfo) {
          this.sessionInfo.country_code = data.country_code;
          this.sessionInfo.city = data.city;
        }
      }
    } catch (error) {
      // Geographic info is optional, don't fail the whole service
      loggingService.debug('Could not get geographic info', error);
    }
  }

  /**
   * Track an event
   */
  async track(eventName: string, properties?: Record<string, any>, userProperties?: UserProperties): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        event_name: eventName,
        event_properties: {
          ...properties,
          page_url: window.location.href,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
        },
        user_properties: userProperties,
        timestamp: new Date().toISOString(),
      };

      // Add to queue
      this.eventQueue.push(event);

      // If online and queue is getting large, flush immediately
      if (this.isOnline && this.eventQueue.length >= 10) {
        await this.flushEvents();
      }

      loggingService.debug('Event tracked', { eventName, properties });
    } catch (error) {
      loggingService.error('Failed to track event', { eventName, error });
    }
  }

  /**
   * Track page view
   */
  async trackPageView(pageName?: string, properties?: Record<string, any>): Promise<void> {
    await this.track('page_viewed', {
      page_name: pageName || document.title,
      page_url: window.location.href,
      referrer: document.referrer,
      ...properties,
    });
  }

  /**
   * Track game events
   */
  async trackGameJoined(gameType: string, gameId?: string): Promise<void> {
    await this.track('game_joined', {
      game_type: gameType,
      game_id: gameId,
    });
  }

  async trackRoundSubmitted(gameId: string, roundNumber: number, timeToSubmit?: number): Promise<void> {
    await this.track('round_submitted', {
      game_id: gameId,
      round_number: roundNumber,
      time_to_submit_seconds: timeToSubmit,
    });
  }

  async trackRevealViewed(gameId: string, revealType: string): Promise<void> {
    await this.track('reveal_viewed', {
      game_id: gameId,
      reveal_type: revealType,
    });
  }

  async trackReelCreated(gameId: string, creationMethod: string): Promise<void> {
    await this.track('reel_created', {
      game_id: gameId,
      creation_method: creationMethod,
    });
  }

  async trackShareClicked(content: string, platform?: string): Promise<void> {
    await this.track('share_clicked', {
      content_type: content,
      platform: platform,
    });
  }

  async trackTournamentJoined(tournamentId: string): Promise<void> {
    await this.track('tournament_joined', {
      tournament_id: tournamentId,
    });
  }

  async trackPaymentSucceeded(amount: number, currency: string, product: string): Promise<void> {
    await this.track('payment_succeeded', {
      amount_cents: Math.round(amount * 100),
      currency: currency,
      product: product,
    }, {
      subscription_status: 'active'
    });
  }

  /**
   * Track conversion events
   */
  async trackConversion(conversionType: string, value?: number, properties?: Record<string, any>): Promise<void> {
    await this.track('conversion', {
      conversion_type: conversionType,
      value: value,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    // Track user properties update
    await this.track('user_properties_updated', {}, properties);
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metric: string, value: number, properties?: Record<string, any>): Promise<void> {
    await this.track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      ...properties,
    });
  }

  /**
   * Track errors
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.track('error_occurred', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Flush queued events to the database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.sessionInfo) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Prepare events for database insertion
      const eventsToInsert = events.map(event => ({
        user_id: user.user?.id || null,
        session_id: this.sessionInfo!.session_id,
        event_name: event.event_name,
        event_properties: event.event_properties || {},
        user_properties: event.user_properties || {},
        timestamp: event.timestamp,
        device_type: this.sessionInfo!.device_type,
        user_agent: this.sessionInfo!.user_agent,
        country_code: this.sessionInfo!.country_code,
        city: this.sessionInfo!.city,
        page_url: event.event_properties?.page_url,
        referrer: event.event_properties?.referrer,
        utm_source: this.sessionInfo!.utm_source,
        utm_medium: this.sessionInfo!.utm_medium,
        utm_campaign: this.sessionInfo!.utm_campaign,
      }));

      // Insert events in batches
      const batchSize = 100;
      for (let i = 0; i < eventsToInsert.length; i += batchSize) {
        const batch = eventsToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('analytics_events')
          .insert(batch);

        if (error) {
          loggingService.error('Failed to insert analytics events batch', error);
          // Put failed events back in queue
          this.eventQueue.unshift(...events.slice(i, i + batch.length));
          break;
        }
      }

      loggingService.debug('Analytics events flushed', { count: events.length });
    } catch (error) {
      loggingService.error('Failed to flush analytics events', error);
      // Put events back in queue
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start a new user session
   */
  async startSession(): Promise<void> {
    if (!this.sessionInfo) {
      this.initializeSession();
    }

    const { data: user } = await supabase.auth.getUser();
    
    if (this.sessionInfo) {
      // Insert or update session record
      const sessionData = {
        user_id: user.user?.id || null,
        session_id: this.sessionInfo.session_id,
        started_at: this.sessionInfo.started_at.toISOString(),
        device_type: this.sessionInfo.device_type,
        browser: this.getBrowser(),
        os: this.getOS(),
        screen_resolution: `${screen.width}x${screen.height}`,
        country_code: this.sessionInfo.country_code,
        city: this.sessionInfo.city,
        landing_page: window.location.href,
        referrer: document.referrer,
        utm_source: this.sessionInfo.utm_source,
        utm_medium: this.sessionInfo.utm_medium,
        utm_campaign: this.sessionInfo.utm_campaign,
      };

      await supabase
        .from('user_sessions')
        .upsert(sessionData, { onConflict: 'session_id' });

      await this.track('session_started');
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.sessionInfo) return;

    await this.track('session_ended');
    await this.flushEvents();

    // Update session end time
    const { data: user } = await supabase.auth.getUser();
    
    if (user.user) {
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          page_views: this.getPageViews(),
          events_count: this.getEventsCount(),
        })
        .eq('session_id', this.sessionInfo.session_id);
    }
  }

  /**
   * Get funnel progress for a user
   */
  async getFunnelProgress(funnelName: string): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('funnel_user_progress')
      .select(`
        *,
        conversion_funnels (name, steps)
      `)
      .eq('funnel_id', funnelName)
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      loggingService.error('Failed to get funnel progress', error);
      return null;
    }

    return data;
  }

  /**
   * Track funnel step completion
   */
  async trackFunnelStep(funnelName: string, stepName: string): Promise<void> {
    await this.track('funnel_step_completed', {
      funnel_name: funnelName,
      step_name: stepName,
    });
  }

  // Utility methods
  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getPageViews(): number {
    // This would be tracked by counting page_viewed events in the session
    return this.eventQueue.filter(e => e.event_name === 'page_viewed').length;
  }

  private getEventsCount(): number {
    return this.eventQueue.length;
  }

  /**
   * Clean up service
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
  }
}

export const analyticsService = new AnalyticsService();

// Auto-start session when service is imported
analyticsService.startSession();

// Export types for use in other files
export type { AnalyticsEvent, UserProperties };