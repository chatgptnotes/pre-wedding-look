import { supabase } from './supabase';

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  theme: ChallengeTheme;
  title: string;
  description: string;
  prompt_template: string;
  bonus_credits: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyChallengeParticipation {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  credits_awarded: number;
  reel_id?: string;
  metadata: any;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  streak_freeze_count: number;
  total_challenges_completed: number;
  created_at: string;
  updated_at: string;
}

export type ChallengeTheme = 
  | 'romantic_sunset'
  | 'bollywood_glam'
  | 'vintage_classic'
  | 'modern_chic'
  | 'cultural_fusion'
  | 'destination_wedding'
  | 'minimalist_elegance';

export interface ChallengeParticipationResult {
  success: boolean;
  participation_id?: string;
  credits_awarded?: number;
  current_streak?: number;
  longest_streak?: number;
  transaction_id?: string;
  error?: string;
}

class DailyChallengeService {
  /**
   * Get today's active challenge
   */
  async getTodaysChallenge(): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No challenge found for today
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching today\'s challenge:', error);
      throw error;
    }
  }

  /**
   * Get challenges for a specific date range
   */
  async getChallenges(startDate: string, endDate: string): Promise<DailyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .gte('challenge_date', startDate)
        .lte('challenge_date', endDate)
        .eq('is_active', true)
        .order('challenge_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  }

  /**
   * Check if user has participated in today's challenge
   */
  async hasUserParticipatedToday(userId: string): Promise<boolean> {
    try {
      const todaysChallenge = await this.getTodaysChallenge();
      if (!todaysChallenge) return false;

      const { data, error } = await supabase
        .from('daily_challenge_participations')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', todaysChallenge.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No participation found
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking user participation:', error);
      throw error;
    }
  }

  /**
   * Get user's streak information
   */
  async getUserStreak(userId: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No streak record found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user streak:', error);
      throw error;
    }
  }

  /**
   * Participate in daily challenge
   */
  async participateInChallenge(
    userId: string, 
    challengeId: string, 
    reelId?: string
  ): Promise<ChallengeParticipationResult> {
    try {
      const { data, error } = await supabase.rpc('participate_in_daily_challenge', {
        user_uuid: userId,
        challenge_uuid: challengeId,
        reel_uuid: reelId
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      return data as ChallengeParticipationResult;
    } catch (error) {
      console.error('Error participating in challenge:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's challenge participation history
   */
  async getUserParticipationHistory(
    userId: string,
    limit: number = 50
  ): Promise<(DailyChallengeParticipation & { challenge: DailyChallenge })[]> {
    try {
      const { data, error } = await supabase
        .from('daily_challenge_participations')
        .select(`
          *,
          challenge:challenge_id(*)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching participation history:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard for current week's challenge participation
   */
  async getWeeklyLeaderboard(limit: number = 10): Promise<{
    user_id: string;
    total_challenges_completed: number;
    current_streak: number;
    longest_streak: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('user_id, total_challenges_completed, current_streak, longest_streak')
        .order('current_streak', { ascending: false })
        .order('total_challenges_completed', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      throw error;
    }
  }

  /**
   * Calculate streak bonus credits based on current streak
   */
  calculateStreakBonus(currentStreak: number): number {
    if (currentStreak >= 30) return 200; // Monthly streak mega bonus
    if (currentStreak >= 14) return 100; // Bi-weekly streak bonus
    if (currentStreak >= 7) return 50;   // Weekly streak bonus
    if (currentStreak >= 3) return 15;   // 3-day streak bonus
    return 0;
  }

  /**
   * Get personalized challenge prompt based on user preferences
   */
  async getPersonalizedPrompt(
    basePrompt: string,
    userId: string
  ): Promise<string> {
    try {
      // Get user's previous reel styles/preferences if available
      const { data: userReels, error } = await supabase
        .from('user_reels')
        .select('style_preferences, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching user reels for personalization:', error);
        return basePrompt;
      }

      // Extract common preferences
      const stylePreferences = userReels
        ?.flatMap(reel => reel.style_preferences || [])
        .filter(Boolean);

      if (!stylePreferences || stylePreferences.length === 0) {
        return basePrompt;
      }

      // Count style frequencies
      const styleFrequency = stylePreferences.reduce((acc, style) => {
        acc[style] = (acc[style] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get most preferred style
      const mostPreferredStyle = Object.entries(styleFrequency)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      // Enhance prompt with preferred style
      if (mostPreferredStyle) {
        return `${basePrompt}, incorporating ${mostPreferredStyle} style elements based on your preferences`;
      }

      return basePrompt;
    } catch (error) {
      console.error('Error personalizing prompt:', error);
      return basePrompt;
    }
  }

  /**
   * Get challenge statistics for user
   */
  async getChallengeStats(userId: string): Promise<{
    totalParticipations: number;
    currentStreak: number;
    longestStreak: number;
    totalCreditsEarned: number;
    favoriteTheme?: ChallengeTheme;
    participationRate: number; // percentage of available challenges participated in
  }> {
    try {
      const [streakData, participationData] = await Promise.all([
        this.getUserStreak(userId),
        supabase
          .from('daily_challenge_participations')
          .select(`
            credits_awarded,
            challenge:challenge_id(theme)
          `)
          .eq('user_id', userId)
      ]);

      if (participationData.error) throw participationData.error;

      const participations = participationData.data || [];
      
      // Calculate total credits earned from challenges
      const totalCreditsEarned = participations.reduce(
        (sum, p) => sum + (p.credits_awarded || 0), 
        0
      );

      // Find favorite theme
      const themeFrequency = participations.reduce((acc, p) => {
        const theme = p.challenge?.theme;
        if (theme) {
          acc[theme] = (acc[theme] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const favoriteTheme = Object.entries(themeFrequency)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as ChallengeTheme;

      // Calculate participation rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: availableChallenges } = await supabase
        .from('daily_challenges')
        .select('id')
        .gte('challenge_date', thirtyDaysAgo.toISOString().split('T')[0])
        .eq('is_active', true);

      const availableCount = availableChallenges?.length || 0;
      const participatedCount = participations.filter(p => 
        new Date(p.challenge?.created_at || '') >= thirtyDaysAgo
      ).length;

      const participationRate = availableCount > 0 
        ? (participatedCount / availableCount) * 100 
        : 0;

      return {
        totalParticipations: participations.length,
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        totalCreditsEarned,
        favoriteTheme,
        participationRate: Math.round(participationRate)
      };
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
      throw error;
    }
  }

  /**
   * Check if user can use a streak freeze (1 per week)
   */
  async canUseStreakFreeze(userId: string): Promise<boolean> {
    try {
      const streak = await this.getUserStreak(userId);
      if (!streak) return false;

      // Check if user has streak freezes available (1 per week, max 1 stored)
      return streak.streak_freeze_count < 1;
    } catch (error) {
      console.error('Error checking streak freeze availability:', error);
      return false;
    }
  }

  /**
   * Use a streak freeze to maintain streak
   */
  async useStreakFreeze(userId: string): Promise<boolean> {
    try {
      const canUse = await this.canUseStreakFreeze(userId);
      if (!canUse) return false;

      const { error } = await supabase
        .from('user_streaks')
        .update({ 
          streak_freeze_count: 0,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error using streak freeze:', error);
      return false;
    }
  }
}

export const dailyChallengeService = new DailyChallengeService();