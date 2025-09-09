import { supabase } from '../lib/supabase';
import { loggingService } from './loggingService';
import { analyticsService } from './analyticsService';

// Experiment configuration types
export interface ExperimentVariant {
  id: string;
  name: string;
  allocation: number; // 0.0 to 1.0
  config: Record<string, any>;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  traffic_allocation: number;
  variants: ExperimentVariant[];
  control_variant_id: string;
  primary_metric: string;
  secondary_metrics?: string[];
  confidence_level: number;
  minimum_detectable_effect: number;
  minimum_sample_size: number;
  start_date?: string;
  end_date?: string;
  target_countries?: string[];
  target_devices?: string[];
  target_user_segments?: string[];
  statistical_significance?: number;
  winning_variant_id?: string;
  results_summary?: Record<string, any>;
}

export interface ExperimentAssignment {
  user_id: string;
  experiment_id: string;
  variant_id: string;
  assigned_at: string;
}

export interface ExperimentResults {
  experiment_id: string;
  variant_id: string;
  total_users: number;
  conversions: number;
  conversion_rate: number;
  confidence_interval: [number, number];
  statistical_significance: number;
  is_winning: boolean;
}

class ExperimentService {
  private assignmentCache = new Map<string, string>();
  private experimentCache = new Map<string, Experiment>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadExperiments();
  }

  /**
   * Get variant for a user in an experiment
   */
  async getVariant(experimentName: string, userId?: string): Promise<string | null> {
    try {
      // Use current user if not provided
      if (!userId) {
        const { data: user } = await supabase.auth.getUser();
        userId = user.user?.id;
      }

      if (!userId) {
        // For anonymous users, use session-based assignment
        userId = this.getAnonymousUserId();
      }

      const cacheKey = `${experimentName}:${userId}`;
      
      // Check cache first
      if (this.assignmentCache.has(cacheKey)) {
        const cachedAssignment = this.assignmentCache.get(cacheKey);
        const expiry = this.cacheExpiry.get(cacheKey);
        
        if (expiry && Date.now() < expiry) {
          return cachedAssignment || null;
        }
      }

      // Get assignment from database or create new one
      const { data, error } = await supabase.rpc('get_experiment_assignment', {
        p_user_id: userId,
        p_experiment_name: experimentName
      });

      if (error) {
        loggingService.error('Failed to get experiment assignment', { experimentName, error });
        return null;
      }

      const variant = data as string | null;
      
      // Cache the result
      this.assignmentCache.set(cacheKey, variant || '');
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      // Track assignment event
      if (variant) {
        await analyticsService.track('experiment_assigned', {
          experiment_name: experimentName,
          variant_id: variant,
        });
      }

      return variant;
    } catch (error) {
      loggingService.error('Error getting experiment variant', { experimentName, error });
      return null;
    }
  }

  /**
   * Check if user is in an experiment variant
   */
  async isInVariant(experimentName: string, variantId: string, userId?: string): Promise<boolean> {
    const assignedVariant = await this.getVariant(experimentName, userId);
    return assignedVariant === variantId;
  }

  /**
   * Check if experiment is active
   */
  async isExperimentActive(experimentName: string): Promise<boolean> {
    const experiment = await this.getExperiment(experimentName);
    if (!experiment) return false;

    const now = new Date();
    const startDate = experiment.start_date ? new Date(experiment.start_date) : null;
    const endDate = experiment.end_date ? new Date(experiment.end_date) : null;

    return (
      experiment.status === 'running' &&
      (!startDate || now >= startDate) &&
      (!endDate || now <= endDate)
    );
  }

  /**
   * Track experiment event
   */
  async trackEvent(
    experimentName: string,
    eventName: string,
    properties?: Record<string, any>,
    value?: number,
    userId?: string
  ): Promise<void> {
    try {
      if (!userId) {
        const { data: user } = await supabase.auth.getUser();
        userId = user.user?.id;
      }

      if (!userId) {
        userId = this.getAnonymousUserId();
      }

      // Track the experiment event
      const { error } = await supabase.rpc('track_experiment_event', {
        p_user_id: userId,
        p_experiment_name: experimentName,
        p_event_name: eventName,
        p_event_properties: properties || {},
        p_value: value || null
      });

      if (error) {
        loggingService.error('Failed to track experiment event', { experimentName, eventName, error });
        return;
      }

      // Also track in general analytics
      const variant = await this.getVariant(experimentName, userId);
      await analyticsService.track(`experiment_${eventName}`, {
        experiment_name: experimentName,
        variant_id: variant,
        ...properties,
      });

    } catch (error) {
      loggingService.error('Error tracking experiment event', { experimentName, eventName, error });
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(
    experimentName: string,
    conversionType: string = 'primary',
    value?: number,
    properties?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.trackEvent(experimentName, `conversion_${conversionType}`, properties, value, userId);
  }

  /**
   * Get experiment configuration
   */
  async getExperiment(experimentName: string): Promise<Experiment | null> {
    try {
      // Check cache first
      if (this.experimentCache.has(experimentName)) {
        const experiment = this.experimentCache.get(experimentName);
        const expiry = this.cacheExpiry.get(`exp:${experimentName}`);
        
        if (experiment && expiry && Date.now() < expiry) {
          return experiment;
        }
      }

      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('name', experimentName)
        .single();

      if (error) {
        loggingService.error('Failed to get experiment', { experimentName, error });
        return null;
      }

      const experiment = data as Experiment;
      
      // Cache the result
      this.experimentCache.set(experimentName, experiment);
      this.cacheExpiry.set(`exp:${experimentName}`, Date.now() + this.CACHE_DURATION);

      return experiment;
    } catch (error) {
      loggingService.error('Error getting experiment', { experimentName, error });
      return null;
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentName: string): Promise<ExperimentResults[] | null> {
    try {
      const { data, error } = await supabase
        .from('experiment_events')
        .select(`
          variant_id,
          experiment:experiments!inner(name),
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as total_users
        `)
        .eq('experiments.name', experimentName)
        .group(['variant_id', 'experiments.name']);

      if (error) {
        loggingService.error('Failed to get experiment results', { experimentName, error });
        return null;
      }

      // Calculate conversion rates and statistical significance
      // This is a simplified version - in production you'd want more sophisticated statistical analysis
      const results: ExperimentResults[] = [];
      
      for (const row of data) {
        const conversionData = await this.getConversionData(experimentName, row.variant_id);
        results.push({
          experiment_id: experimentName,
          variant_id: row.variant_id,
          total_users: row.total_users,
          conversions: conversionData.conversions,
          conversion_rate: conversionData.conversion_rate,
          confidence_interval: conversionData.confidence_interval,
          statistical_significance: conversionData.statistical_significance,
          is_winning: false, // Will be determined by comparing all variants
        });
      }

      // Determine winning variant
      if (results.length > 1) {
        const sortedResults = results.sort((a, b) => b.conversion_rate - a.conversion_rate);
        if (sortedResults[0].statistical_significance > 0.95) {
          sortedResults[0].is_winning = true;
        }
      }

      return results;
    } catch (error) {
      loggingService.error('Error getting experiment results', { experimentName, error });
      return null;
    }
  }

  /**
   * Get all active experiments
   */
  async getActiveExperiments(): Promise<Experiment[]> {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('status', 'running')
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

      if (error) {
        loggingService.error('Failed to get active experiments', error);
        return [];
      }

      return data as Experiment[];
    } catch (error) {
      loggingService.error('Error getting active experiments', error);
      return [];
    }
  }

  /**
   * Create new experiment (admin only)
   */
  async createExperiment(experiment: Partial<Experiment>): Promise<Experiment | null> {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .insert({
          ...experiment,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        loggingService.error('Failed to create experiment', error);
        return null;
      }

      // Clear cache
      this.experimentCache.clear();
      this.cacheExpiry.clear();

      return data as Experiment;
    } catch (error) {
      loggingService.error('Error creating experiment', error);
      return null;
    }
  }

  /**
   * Update experiment (admin only)
   */
  async updateExperiment(experimentName: string, updates: Partial<Experiment>): Promise<Experiment | null> {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('name', experimentName)
        .select()
        .single();

      if (error) {
        loggingService.error('Failed to update experiment', { experimentName, error });
        return null;
      }

      // Clear cache
      this.experimentCache.delete(experimentName);
      this.cacheExpiry.delete(`exp:${experimentName}`);

      return data as Experiment;
    } catch (error) {
      loggingService.error('Error updating experiment', { experimentName, error });
      return null;
    }
  }

  /**
   * Force user into specific variant (for QA/testing)
   */
  async forceVariant(
    experimentName: string,
    variantId: string,
    userId?: string,
    reason: string = 'manual_override'
  ): Promise<boolean> {
    try {
      if (!userId) {
        const { data: user } = await supabase.auth.getUser();
        userId = user.user?.id;
      }

      if (!userId) return false;

      const experiment = await this.getExperiment(experimentName);
      if (!experiment) return false;

      const { error } = await supabase
        .from('user_experiment_assignments')
        .upsert({
          user_id: userId,
          experiment_id: experiment.id,
          variant_id: variantId,
          override_reason: reason,
          override_by: (await supabase.auth.getUser()).data.user?.id,
        }, { onConflict: 'user_id,experiment_id' });

      if (error) {
        loggingService.error('Failed to force variant', { experimentName, variantId, error });
        return false;
      }

      // Clear cache
      const cacheKey = `${experimentName}:${userId}`;
      this.assignmentCache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);

      return true;
    } catch (error) {
      loggingService.error('Error forcing variant', { experimentName, variantId, error });
      return false;
    }
  }

  /**
   * Get conversion data for a specific variant
   */
  private async getConversionData(experimentName: string, variantId: string) {
    const { data: totalUsers } = await supabase
      .from('user_experiment_assignments')
      .select('count', { count: 'exact' })
      .eq('experiment_id', experimentName)
      .eq('variant_id', variantId);

    const { data: conversions } = await supabase
      .from('experiment_events')
      .select('count', { count: 'exact' })
      .eq('experiment_id', experimentName)
      .eq('variant_id', variantId)
      .like('event_name', 'conversion_%');

    const totalUsersCount = totalUsers?.[0]?.count || 0;
    const conversionsCount = conversions?.[0]?.count || 0;
    const conversion_rate = totalUsersCount > 0 ? conversionsCount / totalUsersCount : 0;

    // Calculate confidence interval (simplified Wilson score interval)
    const z = 1.96; // 95% confidence
    const n = totalUsersCount;
    const p = conversion_rate;
    
    if (n === 0) {
      return {
        conversions: 0,
        conversion_rate: 0,
        confidence_interval: [0, 0] as [number, number],
        statistical_significance: 0,
      };
    }

    const denominator = 1 + (z * z) / n;
    const centre = (p + (z * z) / (2 * n)) / denominator;
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n) / denominator;

    return {
      conversions: conversionsCount,
      conversion_rate: conversion_rate,
      confidence_interval: [Math.max(0, centre - margin), Math.min(1, centre + margin)] as [number, number],
      statistical_significance: n > 100 ? 0.95 : n > 50 ? 0.8 : 0.5, // Simplified
    };
  }

  /**
   * Generate anonymous user ID for session-based experiments
   */
  private getAnonymousUserId(): string {
    let anonymousId = sessionStorage.getItem('anonymous_user_id');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('anonymous_user_id', anonymousId);
    }
    return anonymousId;
  }

  /**
   * Load active experiments into cache
   */
  private async loadExperiments(): Promise<void> {
    try {
      const activeExperiments = await this.getActiveExperiments();
      for (const experiment of activeExperiments) {
        this.experimentCache.set(experiment.name, experiment);
        this.cacheExpiry.set(`exp:${experiment.name}`, Date.now() + this.CACHE_DURATION);
      }
    } catch (error) {
      loggingService.error('Failed to load experiments cache', error);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.assignmentCache.clear();
    this.experimentCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get user's experiment assignments
   */
  async getUserAssignments(userId?: string): Promise<ExperimentAssignment[]> {
    try {
      if (!userId) {
        const { data: user } = await supabase.auth.getUser();
        userId = user.user?.id;
      }

      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_experiment_assignments')
        .select(`
          *,
          experiment:experiments(name, status)
        `)
        .eq('user_id', userId);

      if (error) {
        loggingService.error('Failed to get user assignments', error);
        return [];
      }

      return data as ExperimentAssignment[];
    } catch (error) {
      loggingService.error('Error getting user assignments', error);
      return [];
    }
  }
}

// Export singleton instance
export const experimentService = new ExperimentService();

// Export types
export type { Experiment, ExperimentVariant, ExperimentAssignment, ExperimentResults };