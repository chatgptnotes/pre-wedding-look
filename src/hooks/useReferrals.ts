import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ReferralTier {
  id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  min_referrals: number;
  credits_per_referral: number;
  bonus_multiplier: number;
  tier_bonus_credits: number;
  perks: string[];
  created_at: string;
}

export interface UserReferralProfile {
  id: string;
  user_id: string;
  vanity_slug?: string;
  total_referrals: number;
  successful_referrals: number;
  current_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_progress: number;
  lifetime_tier_credits: number;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  credits_awarded: number;
  status: 'pending' | 'completed' | 'expired';
  tier_at_referral: 'bronze' | 'silver' | 'gold' | 'platinum';
  bonus_multiplier: number;
  converted: boolean;
  conversion_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  totalCreditsEarned: number;
  currentTier: ReferralTier;
  nextTier?: ReferralTier;
  progressToNextTier: number;
  recentReferrals: UserReferral[];
  tierHistory: Array<{
    tier: string;
    achieved_date: string;
    referrals_at_time: number;
  }>;
}

export function useReferrals() {
  const [profile, setProfile] = useState<UserReferralProfile | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralTiers, setReferralTiers] = useState<ReferralTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load referral tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('referral_tiers')
        .select('*')
        .order('min_referrals', { ascending: true });

      if (tiersError) throw tiersError;
      setReferralTiers(tiers || []);

      // Load user referral profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_referral_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Create profile if it doesn't exist
      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .rpc('create_referral_profile', { user_uuid: user.id });
        
        if (createError) throw createError;
        
        // Reload profile after creation
        const { data: createdProfile, error: reloadError } = await supabase
          .from('user_referral_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (reloadError) throw reloadError;
        setProfile(createdProfile);
      } else {
        setProfile(profileData);
      }

      // Load referral stats
      await loadReferralStats();

    } catch (error) {
      console.error('Error loading referral data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferralStats = async () => {
    if (!user) return;

    try {
      // Get user referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      const totalReferrals = referrals?.length || 0;
      const successfulReferrals = referrals?.filter(r => r.converted).length || 0;
      const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;
      const totalCreditsEarned = referrals?.reduce((sum, r) => sum + r.credits_awarded, 0) || 0;

      // Get current and next tier
      const currentTier = referralTiers.find(t => 
        t.min_referrals <= totalReferrals && 
        (referralTiers.find(nt => nt.min_referrals > totalReferrals)?.min_referrals || Infinity) > t.min_referrals
      );

      const nextTier = referralTiers.find(t => t.min_referrals > totalReferrals);

      const progressToNextTier = nextTier 
        ? ((totalReferrals - (currentTier?.min_referrals || 0)) / 
           (nextTier.min_referrals - (currentTier?.min_referrals || 0))) * 100
        : 100;

      setReferralStats({
        totalReferrals,
        successfulReferrals,
        conversionRate: Math.round(conversionRate),
        totalCreditsEarned,
        currentTier: currentTier || referralTiers[0],
        nextTier,
        progressToNextTier: Math.min(100, progressToNextTier),
        recentReferrals: referrals?.slice(0, 10) || [],
        tierHistory: [] // TODO: Implement tier history tracking
      });

    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const createReferral = async (referredUserId: string): Promise<{
    success: boolean;
    referral?: UserReferral;
    error?: string;
  }> => {
    if (!user || !profile) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .insert({
          referrer_id: user.id,
          referred_id: referredUserId,
          referral_code: profile.referral_code,
          tier_at_referral: profile.current_tier,
          bonus_multiplier: referralStats?.currentTier?.bonus_multiplier || 1.0
        })
        .select()
        .single();

      if (error) throw error;

      // Reload referral data
      await loadReferralData();

      return { success: true, referral: data };
    } catch (error) {
      console.error('Error creating referral:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create referral' 
      };
    }
  };

  const updateVanitySlug = async (newSlug: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate slug format (alphanumeric, hyphens, underscores, 3-50 characters)
    const slugRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!slugRegex.test(newSlug)) {
      return { 
        success: false, 
        error: 'Vanity URL must be 3-50 characters and contain only letters, numbers, hyphens, and underscores' 
      };
    }

    try {
      const { error } = await supabase
        .from('user_referral_profiles')
        .update({ vanity_slug: newSlug })
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'This vanity URL is already taken' };
        }
        throw error;
      }

      // Update local state
      if (profile) {
        setProfile({ ...profile, vanity_slug: newSlug });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating vanity slug:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update vanity URL' 
      };
    }
  };

  const generateReferralLink = (baseUrl?: string): string => {
    const base = baseUrl || window.location.origin;
    if (profile?.vanity_slug) {
      return `${base}/invite/${profile.vanity_slug}`;
    }
    return `${base}/invite?ref=${profile?.referral_code}`;
  };

  const getShareableLinks = () => {
    const referralLink = generateReferralLink();
    const message = `Check out PreWedding AI Studio - create stunning AI-powered pre-wedding photos! Use my link to get started: ${referralLink}`;

    return {
      direct: referralLink,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      email: `mailto:?subject=${encodeURIComponent('Check out PreWedding AI Studio')}&body=${encodeURIComponent(message)}`,
      sms: `sms:?body=${encodeURIComponent(message)}`
    };
  };

  const getTierBenefits = (tier: ReferralTier) => {
    const benefits = [
      `${tier.credits_per_referral} credits per successful referral`,
      `${Math.round((tier.bonus_multiplier - 1) * 100)}% bonus credits multiplier`,
      ...tier.perks
    ];

    if (tier.tier_bonus_credits > 0) {
      benefits.unshift(`${tier.tier_bonus_credits} bonus credits for reaching tier`);
    }

    return benefits;
  };

  const getNextTierRequirements = (): string | null => {
    if (!referralStats?.nextTier || !referralStats.currentTier) {
      return null;
    }

    const remaining = referralStats.nextTier.min_referrals - referralStats.totalReferrals;
    return `${remaining} more referral${remaining !== 1 ? 's' : ''} to reach ${referralStats.nextTier.tier} tier`;
  };

  return {
    profile,
    referralStats,
    referralTiers,
    isLoading,
    error,
    createReferral,
    updateVanitySlug,
    generateReferralLink,
    getShareableLinks,
    getTierBenefits,
    getNextTierRequirements,
    refreshData: loadReferralData
  };
}