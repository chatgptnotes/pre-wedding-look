interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  
  // Cache TTL configurations
  static readonly TTL = {
    LEADERBOARD: 5 * 60 * 1000, // 5 minutes
    TOURNAMENT_LIST: 10 * 60 * 1000, // 10 minutes
    USER_PROFILE: 60 * 1000, // 1 minute
    SESSION_DATA: 30 * 1000, // 30 seconds
    STATIC_CONTENT: 60 * 60 * 1000, // 1 hour
  };

  static set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.TTL.STATIC_CONTENT;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  static invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
}