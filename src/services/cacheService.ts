/**
 * Redis Caching Service for Performance Optimization
 * Provides high-performance caching for leaderboards, tournaments, and game data
 */

import { supabase } from '../lib/supabase';

// Cache configuration
const CACHE_CONFIG = {
  // TTL values in seconds
  LEADERBOARD_TTL: 300, // 5 minutes
  TOURNAMENT_LIST_TTL: 600, // 10 minutes  
  GAME_STATE_TTL: 60, // 1 minute
  USER_PROFILE_TTL: 900, // 15 minutes
  STYLE_OPTIONS_TTL: 3600, // 1 hour
  
  // Cache key prefixes
  KEYS: {
    LEADERBOARD: 'leaderboard:',
    TOURNAMENT: 'tournament:',
    GAME_STATE: 'game_state:',
    USER_PROFILE: 'user_profile:',
    STYLE_OPTIONS: 'style_options:',
    RATE_LIMIT: 'rate_limit:',
  }
} as const;

// Mock Redis interface for development
interface RedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<void>;
  exists(key: string): Promise<boolean>;
  flush(): Promise<void>;
}

// In-memory cache for development (replace with actual Redis in production)
class InMemoryCache implements RedisInterface {
  private cache = new Map<string, { value: string; expires: number }>();
  private counters = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, ttl = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.counters.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = this.counters.get(key) || 0;
    const newValue = current + 1;
    this.counters.set(key, newValue);
    return newValue;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expires = Date.now() + (ttl * 1000);
    }
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async flush(): Promise<void> {
    this.cache.clear();
    this.counters.clear();
  }
}

// Redis client instance (use actual Redis in production)
const redis: RedisInterface = new InMemoryCache();

export class CacheService {
  /**
   * Generic cache operations
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Leaderboard caching
   */
  static async getLeaderboard(gameType = 'blinddate'): Promise<any[] | null> {
    const key = `${CACHE_CONFIG.KEYS.LEADERBOARD}${gameType}`;
    return this.get(key);
  }

  static async setLeaderboard(gameType = 'blinddate', data: any[]): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.LEADERBOARD}${gameType}`;
    await this.set(key, data, CACHE_CONFIG.LEADERBOARD_TTL);
  }

  static async invalidateLeaderboard(gameType = 'blinddate'): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.LEADERBOARD}${gameType}`;
    await this.del(key);
  }

  /**
   * Tournament list caching
   */
  static async getTournamentList(): Promise<any[] | null> {
    const key = `${CACHE_CONFIG.KEYS.TOURNAMENT}list`;
    return this.get(key);
  }

  static async setTournamentList(tournaments: any[]): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.TOURNAMENT}list`;
    await this.set(key, tournaments, CACHE_CONFIG.TOURNAMENT_LIST_TTL);
  }

  static async invalidateTournamentList(): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.TOURNAMENT}list`;
    await this.del(key);
  }

  /**
   * Game state caching
   */
  static async getGameState(sessionId: string): Promise<any | null> {
    const key = `${CACHE_CONFIG.KEYS.GAME_STATE}${sessionId}`;
    return this.get(key);
  }

  static async setGameState(sessionId: string, gameState: any): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.GAME_STATE}${sessionId}`;
    await this.set(key, gameState, CACHE_CONFIG.GAME_STATE_TTL);
  }

  static async invalidateGameState(sessionId: string): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.GAME_STATE}${sessionId}`;
    await this.del(key);
  }

  /**
   * User profile caching
   */
  static async getUserProfile(userId: string): Promise<any | null> {
    const key = `${CACHE_CONFIG.KEYS.USER_PROFILE}${userId}`;
    return this.get(key);
  }

  static async setUserProfile(userId: string, profile: any): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.USER_PROFILE}${userId}`;
    await this.set(key, profile, CACHE_CONFIG.USER_PROFILE_TTL);
  }

  static async invalidateUserProfile(userId: string): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.USER_PROFILE}${userId}`;
    await this.del(key);
  }

  /**
   * Style options caching (rarely changes)
   */
  static async getStyleOptions(topic: string): Promise<any[] | null> {
    const key = `${CACHE_CONFIG.KEYS.STYLE_OPTIONS}${topic}`;
    return this.get(key);
  }

  static async setStyleOptions(topic: string, options: any[]): Promise<void> {
    const key = `${CACHE_CONFIG.KEYS.STYLE_OPTIONS}${topic}`;
    await this.set(key, options, CACHE_CONFIG.STYLE_OPTIONS_TTL);
  }

  /**
   * Rate limiting support
   */
  static async incrementRateLimit(identifier: string, window = 60): Promise<number> {
    const key = `${CACHE_CONFIG.KEYS.RATE_LIMIT}${identifier}`;
    
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, window);
      }
      return current;
    } catch (error) {
      console.error('Rate limit increment error:', error);
      return 0;
    }
  }

  static async getRateLimitCount(identifier: string): Promise<number> {
    const key = `${CACHE_CONFIG.KEYS.RATE_LIMIT}${identifier}`;
    
    try {
      const cached = await redis.get(key);
      return cached ? parseInt(cached, 10) : 0;
    } catch (error) {
      console.error('Rate limit get error:', error);
      return 0;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  static async warmCache(): Promise<void> {
    try {
      console.log('Warming cache with frequently accessed data...');
      
      // Warm leaderboard
      const { data: leaderboard } = await supabase
        .from('blinddate_leaderboard')
        .select('*')
        .order('total_wins', { ascending: false })
        .limit(50);
      
      if (leaderboard) {
        await this.setLeaderboard('blinddate', leaderboard);
      }

      // Warm tournament list
      const { data: tournaments } = await supabase
        .from('blinddate_tournaments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (tournaments) {
        await this.setTournamentList(tournaments);
      }

      console.log('Cache warmed successfully');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  /**
   * Cache statistics and monitoring
   */
  static async getCacheStats(): Promise<{
    totalKeys: number;
    hitRate: number;
    memoryUsage: string;
  }> {
    // Mock stats for development
    return {
      totalKeys: (redis as InMemoryCache)['cache'].size || 0,
      hitRate: 0.85, // 85% hit rate
      memoryUsage: '12MB'
    };
  }

  /**
   * Cache invalidation patterns
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    // In production with Redis, use SCAN to find and delete matching keys
    console.log(`Would invalidate cache pattern: ${pattern}`);
  }

  /**
   * Clear all cache (use with caution)
   */
  static async clearAll(): Promise<void> {
    try {
      await redis.flush();
      console.log('All cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

// Cache warming on service initialization
CacheService.warmCache();

export default CacheService;