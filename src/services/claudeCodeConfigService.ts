import { supabase } from '../lib/supabase';
import { ClaudeCodeConfig, UserSettings, DEFAULT_CLAUDE_CODE_CONFIG } from '../types/claudeCode';

export class ClaudeCodeConfigService {
  private static config: ClaudeCodeConfig = { ...DEFAULT_CLAUDE_CODE_CONFIG };
  private static subscribers: Set<(config: ClaudeCodeConfig) => void> = new Set();
  private static initialized = false;

  public static async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      if (userId) {
        await this.loadUserConfig(userId);
      } else {
        this.loadLocalConfig();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Claude Code config:', error);
      this.config = { ...DEFAULT_CLAUDE_CODE_CONFIG };
      this.initialized = true;
    }
  }

  public static async loadUserConfig(userId: string): Promise<ClaudeCodeConfig> {
    try {
      const { data, error } = await supabase
        .from('claude_code_user_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.settings) {
        this.config = { ...DEFAULT_CLAUDE_CODE_CONFIG, ...data.settings };
      } else {
        // Create default settings for new user
        await this.saveUserConfig(userId, this.config);
      }

      this.notifySubscribers();
      return this.config;
    } catch (error) {
      console.error('Failed to load user config:', error);
      this.loadLocalConfig();
      return this.config;
    }
  }

  public static async saveUserConfig(userId: string, config: Partial<ClaudeCodeConfig>): Promise<void> {
    const updatedConfig = { ...this.config, ...config };

    try {
      const { error } = await supabase
        .from('claude_code_user_settings')
        .upsert({
          user_id: userId,
          settings: updatedConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      this.config = updatedConfig;
      this.saveLocalConfig();
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save user config:', error);
      // Fallback to local storage
      this.config = updatedConfig;
      this.saveLocalConfig();
      this.notifySubscribers();
    }
  }

  public static loadLocalConfig(): void {
    try {
      const stored = localStorage.getItem('claude_code_config');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = { ...DEFAULT_CLAUDE_CODE_CONFIG, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Failed to load local config:', error);
      this.config = { ...DEFAULT_CLAUDE_CODE_CONFIG };
    }
  }

  public static saveLocalConfig(): void {
    try {
      localStorage.setItem('claude_code_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save local config:', error);
    }
  }

  public static getConfig(): ClaudeCodeConfig {
    return { ...this.config };
  }

  public static async updateConfig(userId: string | undefined, updates: Partial<ClaudeCodeConfig>): Promise<ClaudeCodeConfig> {
    if (userId) {
      await this.saveUserConfig(userId, updates);
    } else {
      this.config = { ...this.config, ...updates };
      this.saveLocalConfig();
      this.notifySubscribers();
    }
    
    return this.config;
  }

  public static subscribe(callback: (config: ClaudeCodeConfig) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public static async resetToDefaults(userId?: string): Promise<ClaudeCodeConfig> {
    const defaultConfig = { ...DEFAULT_CLAUDE_CODE_CONFIG };
    
    if (userId) {
      await this.saveUserConfig(userId, defaultConfig);
    } else {
      this.config = defaultConfig;
      this.saveLocalConfig();
      this.notifySubscribers();
    }
    
    return this.config;
  }

  private static notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Error in config subscriber:', error);
      }
    });
  }

  public static isInitialized(): boolean {
    return this.initialized;
  }

  public static getConfigStatus(): {
    bypassEnabled: boolean;
    autoAcceptAll: boolean;
    riskLevel: string;
    operationsCount: number;
  } {
    return {
      bypassEnabled: this.config.confirmationBypass,
      autoAcceptAll: this.config.autoAcceptAll,
      riskLevel: this.config.riskLevel,
      operationsCount: this.config.allowedOperations.length
    };
  }
}

// Initialize with environment-specific defaults
const ENVIRONMENT_CONFIGS = {
  development: {
    debugMode: true,
    sessionTimeout: 3600000, // 1 hour
    riskLevel: 'moderate' as const
  },
  production: {
    debugMode: false,
    sessionTimeout: 1800000, // 30 minutes
    riskLevel: 'conservative' as const
  }
};

const env = process.env.NODE_ENV || 'development';
const envConfig = ENVIRONMENT_CONFIGS[env as keyof typeof ENVIRONMENT_CONFIGS] || ENVIRONMENT_CONFIGS.development;

// Apply environment-specific defaults
Object.assign(DEFAULT_CLAUDE_CODE_CONFIG, envConfig);