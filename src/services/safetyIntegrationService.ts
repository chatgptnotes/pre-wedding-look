import { moderationService } from './moderationService';
import { fraudDetectionService } from './fraudDetectionService';
import { dailyChallengeService } from './dailyChallengeService';
import { supabase } from './supabase';

export interface SafetyCheck {
  is_safe: boolean;
  risk_score: number;
  blocked_reasons: string[];
  restrictions: {
    daily_limit_reached: boolean;
    requires_verification: boolean;
    shadow_banned: boolean;
    temporarily_restricted: boolean;
  };
  actions_required: string[];
}

export interface UserAction {
  action_type: 'content_generation' | 'referral_creation' | 'challenge_participation' | 'profile_update' | 'payment';
  user_id: string;
  content_data?: {
    text?: string;
    image_url?: string;
    content_id: string;
    content_type: string;
  };
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Integrates safety measures with growth features
 * Ensures all user actions are protected by comprehensive safety checks
 */
class SafetyIntegrationService {
  /**
   * Main safety gate - checks all safety measures before allowing actions
   */
  async checkActionSafety(action: UserAction): Promise<SafetyCheck> {
    const result: SafetyCheck = {
      is_safe: true,
      risk_score: 0,
      blocked_reasons: [],
      restrictions: {
        daily_limit_reached: false,
        requires_verification: false,
        shadow_banned: false,
        temporarily_restricted: false
      },
      actions_required: []
    };

    try {
      // Step 1: Check user risk profile
      const userRisk = await this.checkUserRisk(action.user_id);
      result.risk_score = Math.max(result.risk_score, userRisk.risk_score);

      if (userRisk.is_shadow_banned) {
        result.restrictions.shadow_banned = true;
        // For shadow banned users, we pretend the action succeeds but don't actually process it
        return result; // Return as "safe" but shadow banned
      }

      if (userRisk.is_restricted) {
        result.is_safe = false;
        result.blocked_reasons.push('Account temporarily restricted');
        result.restrictions.temporarily_restricted = true;
      }

      // Step 2: Check velocity limits
      const velocityCheck = await this.checkVelocityLimits(action);
      if (velocityCheck.is_exceeded) {
        result.is_safe = false;
        result.blocked_reasons.push(`Rate limit exceeded: ${velocityCheck.limit_type}`);
        result.restrictions.daily_limit_reached = true;
      }

      // Step 3: Content moderation (if applicable)
      if (action.content_data) {
        const contentCheck = await this.checkContentSafety(action);
        result.risk_score = Math.max(result.risk_score, contentCheck.risk_score);
        
        if (contentCheck.is_blocked) {
          result.is_safe = false;
          result.blocked_reasons.push(...contentCheck.reasons);
        }
      }

      // Step 4: Fraud detection
      const fraudCheck = await this.checkFraudPatterns(action);
      result.risk_score = Math.max(result.risk_score, fraudCheck.risk_score);
      
      if (fraudCheck.should_block) {
        result.is_safe = false;
        result.blocked_reasons.push(fraudCheck.reason);
      }

      // Step 5: Check verification requirements
      const verificationCheck = await this.checkVerificationRequirements(action);
      if (verificationCheck.required) {
        result.restrictions.requires_verification = true;
        result.actions_required.push(...verificationCheck.actions_needed);
        
        if (verificationCheck.blocking) {
          result.is_safe = false;
          result.blocked_reasons.push('Verification required');
        }
      }

      // Step 6: Apply action-specific safety rules
      const actionCheck = await this.checkActionSpecificRules(action);
      if (!actionCheck.allowed) {
        result.is_safe = false;
        result.blocked_reasons.push(...actionCheck.reasons);
      }

      return result;

    } catch (error) {
      console.error('Error in safety check:', error);
      
      // Fail secure - if safety check fails, block the action
      return {
        is_safe: false,
        risk_score: 1.0,
        blocked_reasons: ['Safety check failed - please try again'],
        restrictions: {
          daily_limit_reached: false,
          requires_verification: false,
          shadow_banned: false,
          temporarily_restricted: true
        },
        actions_required: ['Contact support if this persists']
      };
    }
  }

  /**
   * Safe participation in daily challenges
   */
  async safelyParticipateInChallenge(
    userId: string,
    challengeId: string,
    reelId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    result?: any;
    safety_result: SafetyCheck;
    message?: string;
  }> {
    const action: UserAction = {
      action_type: 'challenge_participation',
      user_id: userId,
      metadata: { challenge_id: challengeId, reel_id: reelId },
      ip_address: ipAddress,
      user_agent: userAgent
    };

    const safetyResult = await this.checkActionSafety(action);
    await this.logAction(action, safetyResult);

    if (safetyResult.restrictions.shadow_banned) {
      // Pretend success for shadow banned users
      return {
        success: true,
        result: { shadow_banned: true, credits_awarded: 0 },
        safety_result: safetyResult,
        message: 'Challenge completed successfully!'
      };
    }

    if (!safetyResult.is_safe) {
      return {
        success: false,
        safety_result: safetyResult,
        message: safetyResult.blocked_reasons.join(', ')
      };
    }

    // Actually participate in challenge
    try {
      const result = await dailyChallengeService.participateInChallenge(
        userId,
        challengeId,
        reelId
      );

      return {
        success: result.success,
        result,
        safety_result: safetyResult,
        message: result.success 
          ? `Challenge completed! You earned ${result.credits_awarded} credits.`
          : result.error
      };
    } catch (error) {
      return {
        success: false,
        safety_result: safetyResult,
        message: 'Failed to participate in challenge'
      };
    }
  }

  /**
   * Safe content generation with moderation
   */
  async safelyGenerateContent(
    userId: string,
    contentData: {
      text?: string;
      image_url?: string;
      content_id: string;
      content_type: string;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    moderation_result?: any;
    safety_result: SafetyCheck;
    message?: string;
  }> {
    const action: UserAction = {
      action_type: 'content_generation',
      user_id: userId,
      content_data: contentData,
      ip_address: ipAddress,
      user_agent: userAgent
    };

    const safetyResult = await this.checkActionSafety(action);
    await this.logAction(action, safetyResult);

    if (safetyResult.restrictions.shadow_banned) {
      // For shadow banned users, return fake success
      return {
        success: true,
        moderation_result: { is_blocked: false, shadow_banned: true },
        safety_result: safetyResult,
        message: 'Content generated successfully!'
      };
    }

    if (!safetyResult.is_safe) {
      return {
        success: false,
        safety_result: safetyResult,
        message: safetyResult.blocked_reasons.join(', ')
      };
    }

    // Content is safe to generate
    return {
      success: true,
      safety_result: safetyResult,
      message: 'Content generation approved'
    };
  }

  /**
   * Safe referral creation
   */
  async safelyCreateReferral(
    referrerId: string,
    referredUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    referral?: any;
    safety_result: SafetyCheck;
    message?: string;
  }> {
    const action: UserAction = {
      action_type: 'referral_creation',
      user_id: referrerId,
      metadata: { referred_user_id: referredUserId },
      ip_address: ipAddress,
      user_agent: userAgent
    };

    const safetyResult = await this.checkActionSafety(action);
    await this.logAction(action, safetyResult);

    if (safetyResult.restrictions.shadow_banned) {
      // Pretend success for shadow banned users
      return {
        success: true,
        referral: { shadow_banned: true },
        safety_result: safetyResult,
        message: 'Referral created successfully!'
      };
    }

    if (!safetyResult.is_safe) {
      return {
        success: false,
        safety_result: safetyResult,
        message: safetyResult.blocked_reasons.join(', ')
      };
    }

    // Actually create referral
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: referredUserId,
          referral_code: `REF_${Date.now()}`,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        referral: data,
        safety_result: safetyResult,
        message: 'Referral created successfully!'
      };
    } catch (error) {
      return {
        success: false,
        safety_result: safetyResult,
        message: 'Failed to create referral'
      };
    }
  }

  /**
   * Check user's overall risk profile
   */
  private async checkUserRisk(userId: string): Promise<{
    risk_score: number;
    is_shadow_banned: boolean;
    is_restricted: boolean;
  }> {
    try {
      const riskProfile = await fraudDetectionService.getUserRiskProfile(userId);
      
      if (!riskProfile) {
        const initialRisk = await fraudDetectionService.assessUserRisk(userId);
        return {
          risk_score: initialRisk,
          is_shadow_banned: false,
          is_restricted: initialRisk > 0.8
        };
      }

      return {
        risk_score: riskProfile.overall_risk_score,
        is_shadow_banned: riskProfile.is_shadow_banned,
        is_restricted: riskProfile.requires_human_review || riskProfile.risk_category === 'critical'
      };
    } catch (error) {
      console.error('Error checking user risk:', error);
      return { risk_score: 0.5, is_shadow_banned: false, is_restricted: false };
    }
  }

  /**
   * Check velocity limits for different actions
   */
  private async checkVelocityLimits(action: UserAction): Promise<{
    is_exceeded: boolean;
    limit_type?: string;
  }> {
    try {
      let velocityAction: 'content_generation' | 'referral_creation' | 'login_attempts' | 'account_creation' | 'password_reset';
      
      switch (action.action_type) {
        case 'content_generation':
          velocityAction = 'content_generation';
          break;
        case 'referral_creation':
          velocityAction = 'referral_creation';
          break;
        default:
          return { is_exceeded: false };
      }

      const check = await fraudDetectionService.checkVelocityLimits(
        velocityAction,
        action.user_id,
        action.ip_address
      );

      return {
        is_exceeded: check.is_exceeded,
        limit_type: `${check.action} (${check.count}/${check.max_allowed} in ${check.time_window_minutes}m)`
      };
    } catch (error) {
      console.error('Error checking velocity limits:', error);
      return { is_exceeded: false };
    }
  }

  /**
   * Check content safety
   */
  private async checkContentSafety(action: UserAction): Promise<{
    risk_score: number;
    is_blocked: boolean;
    reasons: string[];
  }> {
    if (!action.content_data) {
      return { risk_score: 0, is_blocked: false, reasons: [] };
    }

    try {
      const moderationResult = await moderationService.moderateContentEnhanced({
        contentId: action.content_data.content_id,
        contentType: action.content_data.content_type as any,
        userId: action.user_id,
        contentText: action.content_data.text,
        imageUrl: action.content_data.image_url,
        metadata: action.metadata
      });

      return {
        risk_score: moderationResult.risk_score,
        is_blocked: moderationResult.is_blocked,
        reasons: moderationResult.is_blocked 
          ? [moderationResult.reason || 'Content flagged by moderation system']
          : []
      };
    } catch (error) {
      console.error('Error checking content safety:', error);
      return { risk_score: 0.5, is_blocked: false, reasons: [] };
    }
  }

  /**
   * Check for fraud patterns
   */
  private async checkFraudPatterns(action: UserAction): Promise<{
    risk_score: number;
    should_block: boolean;
    reason: string;
  }> {
    try {
      const fraudEvents = await fraudDetectionService.detectFraudPatterns(action.user_id);
      
      if (fraudEvents.length === 0) {
        return { risk_score: 0, should_block: false, reason: '' };
      }

      const maxRiskEvent = fraudEvents.reduce((max, event) => 
        event.risk_score > max.risk_score ? event : max
      );

      const blockAction = fraudDetectionService.shouldBlockAction(
        maxRiskEvent.risk_score,
        action.action_type
      );

      return {
        risk_score: maxRiskEvent.risk_score,
        should_block: blockAction.shouldBlock,
        reason: blockAction.reason || 'Suspicious activity detected'
      };
    } catch (error) {
      console.error('Error checking fraud patterns:', error);
      return { risk_score: 0, should_block: false, reason: '' };
    }
  }

  /**
   * Check verification requirements
   */
  private async checkVerificationRequirements(action: UserAction): Promise<{
    required: boolean;
    blocking: boolean;
    actions_needed: string[];
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { required: true, blocking: true, actions_needed: ['Please log in'] };
      }

      const actionsNeeded: string[] = [];
      let required = false;
      let blocking = false;

      // Email verification
      if (!user.user.email_confirmed_at) {
        required = true;
        actionsNeeded.push('Verify your email address');
        
        // Block sensitive actions if email not verified
        if (['payment', 'referral_creation'].includes(action.action_type)) {
          blocking = true;
        }
      }

      // Phone verification for high-value actions
      if (!user.user.phone && ['payment'].includes(action.action_type)) {
        required = true;
        blocking = true;
        actionsNeeded.push('Add and verify phone number');
      }

      // Additional verification for high-risk users
      const riskProfile = await fraudDetectionService.getUserRiskProfile(action.user_id);
      if (riskProfile?.risk_category === 'high' && action.action_type === 'content_generation') {
        required = true;
        actionsNeeded.push('Complete additional identity verification');
      }

      return { required, blocking, actions_needed: actionsNeeded };
    } catch (error) {
      console.error('Error checking verification requirements:', error);
      return { required: false, blocking: false, actions_needed: [] };
    }
  }

  /**
   * Action-specific safety rules
   */
  private async checkActionSpecificRules(action: UserAction): Promise<{
    allowed: boolean;
    reasons: string[];
  }> {
    try {
      const reasons: string[] = [];

      switch (action.action_type) {
        case 'challenge_participation':
          // Check if user already participated today
          const hasParticipated = await dailyChallengeService.hasUserParticipatedToday(action.user_id);
          if (hasParticipated) {
            reasons.push('You have already participated in today\'s challenge');
          }
          break;

        case 'referral_creation':
          // Check if referral target is valid
          if (action.metadata?.referred_user_id === action.user_id) {
            reasons.push('Cannot refer yourself');
          }
          
          // Check if user already referred this person
          const { data: existingReferral } = await supabase
            .from('user_referrals')
            .select('id')
            .eq('referrer_id', action.user_id)
            .eq('referred_id', action.metadata?.referred_user_id)
            .single();
            
          if (existingReferral) {
            reasons.push('User already referred');
          }
          break;

        case 'content_generation':
          // Check daily generation limits based on user tier
          const riskProfile = await fraudDetectionService.getUserRiskProfile(action.user_id);
          const dailyLimit = riskProfile?.max_daily_generations || 100;
          
          const today = new Date().toISOString().split('T')[0];
          const { data: todaysGenerations } = await supabase
            .from('security_audit_log')
            .select('id')
            .eq('user_id', action.user_id)
            .eq('event_type', 'content_generation')
            .gte('created_at', today);
            
          if (todaysGenerations && todaysGenerations.length >= dailyLimit) {
            reasons.push(`Daily generation limit of ${dailyLimit} reached`);
          }
          break;
      }

      return {
        allowed: reasons.length === 0,
        reasons
      };
    } catch (error) {
      console.error('Error checking action-specific rules:', error);
      return { allowed: true, reasons: [] };
    }
  }

  /**
   * Log action for audit trail
   */
  private async logAction(action: UserAction, safetyResult: SafetyCheck): Promise<void> {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: action.action_type,
          user_id: action.user_id,
          description: `${action.action_type} ${safetyResult.is_safe ? 'allowed' : 'blocked'}`,
          metadata: {
            action_details: action,
            safety_result: safetyResult,
            blocked_reasons: safetyResult.blocked_reasons,
            risk_score: safetyResult.risk_score
          },
          ip_address: action.ip_address,
          user_agent: action.user_agent,
          risk_score: safetyResult.risk_score,
          flagged: !safetyResult.is_safe
        });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw - logging shouldn't break the main flow
    }
  }

  /**
   * Get safety dashboard data for a user
   */
  async getSafetyDashboardData(userId: string): Promise<{
    risk_profile: any;
    recent_actions: any[];
    restrictions: any;
    appeals: any[];
  }> {
    try {
      const [riskProfile, recentActions, userRestrictions, appeals] = await Promise.all([
        fraudDetectionService.getUserRiskProfile(userId),
        supabase
          .from('security_audit_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        moderationService.getUserRestrictions(userId),
        supabase
          .from('user_appeals')
          .select('*')
          .eq('user_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(5)
      ]);

      return {
        risk_profile: riskProfile,
        recent_actions: recentActions.data || [],
        restrictions: userRestrictions,
        appeals: appeals.data || []
      };
    } catch (error) {
      console.error('Error getting safety dashboard data:', error);
      throw error;
    }
  }
}

export const safetyIntegrationService = new SafetyIntegrationService();