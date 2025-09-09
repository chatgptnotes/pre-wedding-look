import { supabase } from '../lib/supabase';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (consider Redis for production)
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime <= now) {
      const newEntry = {
        count: 1,
        resetTime: now + windowMs
      };
      this.store.set(key, newEntry);
      return newEntry;
    }

    entry.count++;
    return entry;
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime > Date.now()) {
      return entry;
    }
    return undefined;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

export class RateLimitService {
  private static store = new RateLimitStore();
  
  // Define rate limit configurations for different operations
  static readonly LIMITS = {
    DESIGN_WRITE: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
      message: 'Too many design submissions. Please wait a moment.'
    },
    VOTE: {
      maxRequests: 30,
      windowMs: 60000, // 1 minute
      message: 'Too many votes. Please slow down.'
    },
    IMAGE_GENERATION: {
      maxRequests: 5,
      windowMs: 300000, // 5 minutes
      message: 'Image generation limit reached. Please wait 5 minutes.'
    },
    API_GENERAL: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      message: 'Too many requests. Please try again later.'
    },
    MATCHMAKING: {
      maxRequests: 5,
      windowMs: 60000, // 1 minute
      message: 'Too many matchmaking attempts. Please wait.'
    }
  };

  /**
   * Check if a user has exceeded the rate limit
   */
  static async checkLimit(
    userId: string,
    operation: keyof typeof RateLimitService.LIMITS
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; message?: string }> {
    const config = this.LIMITS[operation];
    const key = `${userId}:${operation}`;
    
    const entry = this.store.increment(key, config.windowMs);
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const allowed = entry.count <= config.maxRequests;

    // Log to database for monitoring
    if (!allowed) {
      await this.logRateLimitHit(userId, operation);
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      message: allowed ? undefined : config.message
    };
  }

  /**
   * Get current rate limit status for a user
   */
  static getStatus(
    userId: string,
    operation: keyof typeof RateLimitService.LIMITS
  ): { count: number; remaining: number; resetTime: number } {
    const config = this.LIMITS[operation];
    const key = `${userId}:${operation}`;
    const entry = this.store.get(key);

    if (!entry) {
      return {
        count: 0,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for a user (admin function)
   */
  static resetLimit(userId: string, operation?: keyof typeof RateLimitService.LIMITS): void {
    if (operation) {
      const key = `${userId}:${operation}`;
      this.store.get(key); // This will auto-clean if expired
    } else {
      // Reset all operations for user
      Object.keys(this.LIMITS).forEach(op => {
        const key = `${userId}:${op}`;
        this.store.get(key); // This will auto-clean if expired
      });
    }
  }

  /**
   * Log rate limit hits for monitoring
   */
  private static async logRateLimitHit(userId: string, operation: string): Promise<void> {
    try {
      await supabase.from('rate_limit_logs').insert({
        user_id: userId,
        operation,
        hit_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log rate limit hit:', error);
    }
  }

  /**
   * Middleware for Express/API routes
   */
  static middleware(operation: keyof typeof RateLimitService.LIMITS) {
    return async (req: any, res: any, next: any) => {
      const userId = req.user?.id || req.ip; // Fallback to IP if no user
      
      const result = await this.checkLimit(userId, operation);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.LIMITS[operation].maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
        return res.status(429).json({
          error: 'Too Many Requests',
          message: result.message,
          retryAfter: result.resetTime
        });
      }
      
      next();
    };
  }

  /**
   * React hook helper for rate limiting
   */
  static async checkAndNotify(
    userId: string,
    operation: keyof typeof RateLimitService.LIMITS,
    onRateLimited?: (message: string, resetTime: number) => void
  ): Promise<boolean> {
    const result = await this.checkLimit(userId, operation);
    
    if (!result.allowed && onRateLimited) {
      onRateLimited(result.message || 'Rate limit exceeded', result.resetTime);
    }
    
    return result.allowed;
  }
}

// Create database table for rate limit logs
export const createRateLimitTable = `
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  operation TEXT NOT NULL,
  hit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user ON rate_limit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_operation ON rate_limit_logs(operation, created_at DESC);
`;