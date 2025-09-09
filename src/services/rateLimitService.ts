/**
 * Rate Limiting Service with User-Friendly Feedback
 * Provides configurable rate limiting with nice UI feedback
 */

import CacheService from './cacheService';

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Game actions
  JOIN_GAME: { requests: 10, window: 60, message: 'Too many join attempts. Please wait a moment.' },
  SUBMIT_DESIGN: { requests: 30, window: 60, message: 'Slow down! You can only submit 30 designs per minute.' },
  CREATE_GAME: { requests: 5, window: 300, message: 'You can only create 5 games per 5 minutes.' },
  
  // AI generation
  GENERATE_IMAGE: { requests: 20, window: 60, message: 'AI is working hard! Please wait before generating more images.' },
  VOICE_GENERATION: { requests: 10, window: 300, message: 'Voice generation is resource intensive. Please wait 5 minutes.' },
  
  // API calls
  API_GENERAL: { requests: 100, window: 60, message: 'You\'re making too many requests. Please slow down.' },
  AUTH_ATTEMPTS: { requests: 5, window: 900, message: 'Too many login attempts. Please wait 15 minutes.' },
  
  // Social features
  LEADERBOARD: { requests: 30, window: 60, message: 'Leaderboard updates limited to 30 per minute.' },
  SHARE_CONTENT: { requests: 10, window: 300, message: 'You can share content 10 times per 5 minutes.' },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'X-RateLimit-Retry-After'?: string;
}

export class RateLimitService {
  /**
   * Check if request is within rate limit
   */
  static async checkRateLimit(
    identifier: string, 
    limitType: keyof typeof RATE_LIMITS,
    customLimit?: { requests: number; window: number; message?: string }
  ): Promise<RateLimitResult> {
    const config = customLimit || RATE_LIMITS[limitType];
    const key = `${limitType}:${identifier}`;
    
    try {
      const current = await CacheService.incrementRateLimit(key, config.window);
      const remaining = Math.max(0, config.requests - current);
      const resetTime = Date.now() + (config.window * 1000);
      
      const allowed = current <= config.requests;
      
      return {
        allowed,
        remaining,
        resetTime,
        message: allowed ? undefined : config.message
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.requests,
        resetTime: Date.now() + (config.window * 1000)
      };
    }
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  static async getRateLimitHeaders(
    identifier: string,
    limitType: keyof typeof RATE_LIMITS
  ): Promise<RateLimitHeaders> {
    const config = RATE_LIMITS[limitType];
    const key = `${limitType}:${identifier}`;
    const current = await CacheService.getRateLimitCount(key);
    const remaining = Math.max(0, config.requests - current);
    const resetTime = Date.now() + (config.window * 1000);
    
    const headers: RateLimitHeaders = {
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString()
    };
    
    if (remaining === 0) {
      headers['X-RateLimit-Retry-After'] = config.window.toString();
    }
    
    return headers;
  }

  /**
   * Create rate limit middleware for API endpoints
   */
  static createMiddleware(limitType: keyof typeof RATE_LIMITS) {
    return async (req: any, res: any, next: any) => {
      const identifier = this.getIdentifier(req);
      const result = await this.checkRateLimit(identifier, limitType);
      
      // Add rate limit headers
      const headers = await this.getRateLimitHeaders(identifier, limitType);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: result.message,
          resetTime: result.resetTime,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }
      
      next();
    };
  }

  /**
   * Get identifier for rate limiting (IP, user ID, etc.)
   */
  private static getIdentifier(req: any): string {
    // Priority: User ID > Session ID > IP Address
    const userId = req.user?.id;
    if (userId) return `user:${userId}`;
    
    const sessionId = req.headers['x-session-id'];
    if (sessionId) return `session:${sessionId}`;
    
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Bulk rate limit check for multiple operations
   */
  static async checkMultipleRateLimits(
    identifier: string,
    limits: Array<{ type: keyof typeof RATE_LIMITS; weight?: number }>
  ): Promise<{ allowed: boolean; violations: string[] }> {
    const violations: string[] = [];
    
    for (const { type, weight = 1 } of limits) {
      for (let i = 0; i < weight; i++) {
        const result = await this.checkRateLimit(identifier, type);
        if (!result.allowed) {
          violations.push(result.message || `Rate limit exceeded for ${type}`);
          break;
        }
      }
    }
    
    return {
      allowed: violations.length === 0,
      violations
    };
  }

  /**
   * Smart rate limiting based on user behavior
   */
  static async smartRateLimit(
    identifier: string,
    baseLimit: keyof typeof RATE_LIMITS,
    factors: {
      userTier?: 'free' | 'premium' | 'pro';
      previousViolations?: number;
      timeOfDay?: 'peak' | 'off-peak';
    } = {}
  ): Promise<RateLimitResult> {
    const config = { ...RATE_LIMITS[baseLimit] };
    
    // Adjust limits based on user tier
    if (factors.userTier === 'premium') {
      config.requests = Math.floor(config.requests * 1.5);
    } else if (factors.userTier === 'pro') {
      config.requests = Math.floor(config.requests * 2);
    }
    
    // Reduce limits for repeat offenders
    if (factors.previousViolations && factors.previousViolations > 3) {
      config.requests = Math.floor(config.requests * 0.5);
      config.message = 'Rate limit reduced due to previous violations. Please follow our usage guidelines.';
    }
    
    // Adjust for peak hours
    if (factors.timeOfDay === 'peak') {
      config.requests = Math.floor(config.requests * 0.8);
    }
    
    return this.checkRateLimit(identifier, baseLimit, config);
  }

  /**
   * Get user-friendly time remaining message
   */
  static formatRetryAfter(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  /**
   * Whitelist IP addresses or users (admin feature)
   */
  static async isWhitelisted(identifier: string): Promise<boolean> {
    // Check whitelist (implement based on your needs)
    const whitelistedIPs = ['127.0.0.1', '::1']; // localhost
    const whitelistedUsers = ['admin']; // admin users
    
    if (identifier.startsWith('ip:')) {
      const ip = identifier.replace('ip:', '');
      return whitelistedIPs.includes(ip);
    }
    
    if (identifier.startsWith('user:')) {
      const userId = identifier.replace('user:', '');
      return whitelistedUsers.includes(userId);
    }
    
    return false;
  }

  /**
   * Report rate limit violations (for monitoring)
   */
  static async reportViolation(
    identifier: string,
    limitType: keyof typeof RATE_LIMITS,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const violation = {
      identifier,
      limitType,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    // Log for monitoring (integrate with your logging service)
    console.warn('Rate limit violation:', violation);
    
    // Store in database for analysis
    try {
      // await supabase.from('rate_limit_violations').insert(violation);
    } catch (error) {
      console.error('Failed to record rate limit violation:', error);
    }
  }

  /**
   * Reset rate limits for specific identifier (admin function)
   */
  static async resetRateLimits(identifier: string): Promise<void> {
    const patterns = Object.keys(RATE_LIMITS).map(type => `${type}:${identifier}`);
    
    for (const pattern of patterns) {
      await CacheService.del(pattern);
    }
    
    console.log(`Rate limits reset for identifier: ${identifier}`);
  }

  /**
   * Get current rate limit status for user dashboard
   */
  static async getRateLimitStatus(identifier: string): Promise<{
    [K in keyof typeof RATE_LIMITS]: {
      limit: number;
      used: number;
      remaining: number;
      resetTime: number;
    }
  }> {
    const status = {} as any;
    
    for (const [limitType, config] of Object.entries(RATE_LIMITS)) {
      const key = `${limitType}:${identifier}`;
      const used = await CacheService.getRateLimitCount(key);
      const remaining = Math.max(0, config.requests - used);
      
      status[limitType] = {
        limit: config.requests,
        used,
        remaining,
        resetTime: Date.now() + (config.window * 1000)
      };
    }
    
    return status;
  }
}

export default RateLimitService;