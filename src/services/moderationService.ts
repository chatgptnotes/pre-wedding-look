import { supabase } from './supabase';

export interface ContentModerationResult {
  id: string;
  content_id: string;
  content_type: 'reel' | 'profile_image' | 'comment' | 'prompt';
  user_id: string;
  nsfw_score: number;
  toxicity_score: number;
  violence_score: number;
  adult_content_score: number;
  is_flagged: boolean;
  auto_action?: 'flag_content' | 'remove_content' | 'warn_user' | 'review_required';
  human_review_required: boolean;
  blocked_terms: string[];
  detected_objects: string[];
  confidence_score: number;
  moderation_service: string;
  service_response: any;
  processed_at: string;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  content_moderation_id: string;
  moderator_id?: string;
  action_type: 'flag_content' | 'remove_content' | 'warn_user' | 'suspend_user' | 'ban_user' | 'shadow_ban' | 'review_required';
  reason: string;
  is_automated: boolean;
  duration_hours?: number;
  expires_at?: string;
  internal_notes?: string;
  public_reason?: string;
  evidence_urls: string[];
  created_at: string;
}

export interface UserAppeal {
  id: string;
  user_id: string;
  moderation_action_id: string;
  appeal_text: string;
  user_evidence_urls: string[];
  status: 'pending' | 'under_review' | 'approved' | 'denied' | 'escalated';
  assigned_reviewer_id?: string;
  reviewer_notes?: string;
  resolution_reason?: string;
  submitted_at: string;
  assigned_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationCheckRequest {
  contentId: string;
  contentType: 'reel' | 'profile_image' | 'comment' | 'prompt';
  userId: string;
  contentText?: string;
  imageUrl?: string;
  metadata?: any;
}

export interface ModerationCheckResponse {
  moderation_id: string;
  requires_review: boolean;
  risk_score: number;
  blocked_terms: string[];
  auto_action?: string;
  is_blocked: boolean;
  reason?: string;
}

class ModerationService {
  private readonly OPENAI_MODERATION_ENDPOINT = 'https://api.openai.com/v1/moderations';
  private readonly GOOGLE_VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

  /**
   * Check content using internal moderation system
   */
  async moderateContent(request: ModerationCheckRequest): Promise<ModerationCheckResponse> {
    try {
      const { data, error } = await supabase.rpc('moderate_content', {
        content_uuid: request.contentId,
        content_type_val: request.contentType,
        user_uuid: request.userId,
        content_text: request.contentText || null,
        image_url: request.imageUrl || null
      });

      if (error) throw error;

      return {
        moderation_id: data.moderation_id,
        requires_review: data.requires_review,
        risk_score: data.risk_score,
        blocked_terms: data.blocked_terms,
        auto_action: data.auto_action,
        is_blocked: data.requires_review && data.risk_score > 0.8,
        reason: data.blocked_terms.length > 0 ? 'Content contains blocked terms' : undefined
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }

  /**
   * Enhanced moderation with external services
   */
  async moderateContentEnhanced(request: ModerationCheckRequest): Promise<ModerationCheckResponse> {
    try {
      // First run internal moderation
      const internalResult = await this.moderateContent(request);

      // If high risk or requires review, use external services
      if (internalResult.risk_score > 0.5 || internalResult.requires_review) {
        let externalScores = {
          nsfw_score: 0,
          toxicity_score: 0,
          violence_score: 0,
          adult_content_score: 0
        };

        // Check text content with OpenAI moderation
        if (request.contentText) {
          const textScores = await this.checkTextContentOpenAI(request.contentText);
          externalScores = { ...externalScores, ...textScores };
        }

        // Check image content with Google Vision
        if (request.imageUrl) {
          const imageScores = await this.checkImageContentGoogle(request.imageUrl);
          externalScores = { ...externalScores, ...imageScores };
        }

        // Update moderation result with external scores
        await this.updateModerationResult(internalResult.moderation_id, externalScores);

        // Recalculate final risk score
        const maxScore = Math.max(
          externalScores.nsfw_score,
          externalScores.toxicity_score,
          externalScores.violence_score,
          externalScores.adult_content_score
        );

        return {
          ...internalResult,
          risk_score: Math.max(internalResult.risk_score, maxScore),
          is_blocked: maxScore > 0.8,
          reason: maxScore > 0.8 ? 'Content flagged by AI moderation' : internalResult.reason
        };
      }

      return internalResult;
    } catch (error) {
      console.error('Error in enhanced moderation:', error);
      // Fall back to internal moderation
      return this.moderateContent(request);
    }
  }

  /**
   * Check text content using OpenAI Moderation API
   */
  private async checkTextContentOpenAI(text: string): Promise<{
    toxicity_score: number;
    violence_score: number;
  }> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured for moderation');
      return { toxicity_score: 0, violence_score: 0 };
    }

    try {
      const response = await fetch(this.OPENAI_MODERATION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-moderation-stable'
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.results[0];

      if (result.flagged) {
        const categories = result.categories;
        const categoryScores = result.category_scores;

        return {
          toxicity_score: Math.max(
            categoryScores.hate || 0,
            categoryScores.harassment || 0,
            categoryScores['hate/threatening'] || 0,
            categoryScores['harassment/threatening'] || 0
          ),
          violence_score: Math.max(
            categoryScores.violence || 0,
            categoryScores['violence/graphic'] || 0
          )
        };
      }

      return { toxicity_score: 0, violence_score: 0 };
    } catch (error) {
      console.error('Error checking text with OpenAI:', error);
      return { toxicity_score: 0, violence_score: 0 };
    }
  }

  /**
   * Check image content using Google Vision API
   */
  private async checkImageContentGoogle(imageUrl: string): Promise<{
    nsfw_score: number;
    adult_content_score: number;
  }> {
    const googleApiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!googleApiKey) {
      console.warn('Google Vision API key not configured for moderation');
      return { nsfw_score: 0, adult_content_score: 0 };
    }

    try {
      const response = await fetch(`${this.GOOGLE_VISION_ENDPOINT}?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                source: { imageUri: imageUrl }
              },
              features: [
                { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const safeSearchAnnotation = data.responses[0]?.safeSearchAnnotation;

      if (safeSearchAnnotation) {
        // Convert likelihood levels to scores (0-1)
        const likelihoodToScore = (likelihood: string): number => {
          switch (likelihood) {
            case 'VERY_LIKELY': return 0.9;
            case 'LIKELY': return 0.7;
            case 'POSSIBLE': return 0.5;
            case 'UNLIKELY': return 0.3;
            case 'VERY_UNLIKELY': return 0.1;
            default: return 0;
          }
        };

        return {
          nsfw_score: Math.max(
            likelihoodToScore(safeSearchAnnotation.adult),
            likelihoodToScore(safeSearchAnnotation.racy)
          ),
          adult_content_score: likelihoodToScore(safeSearchAnnotation.adult)
        };
      }

      return { nsfw_score: 0, adult_content_score: 0 };
    } catch (error) {
      console.error('Error checking image with Google Vision:', error);
      return { nsfw_score: 0, adult_content_score: 0 };
    }
  }

  /**
   * Update moderation result with external service scores
   */
  private async updateModerationResult(
    moderationId: string,
    scores: {
      nsfw_score?: number;
      toxicity_score?: number;
      violence_score?: number;
      adult_content_score?: number;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('content_moderation_results')
        .update(scores)
        .eq('id', moderationId);
    } catch (error) {
      console.error('Error updating moderation result:', error);
    }
  }

  /**
   * Get moderation result by ID
   */
  async getModerationResult(moderationId: string): Promise<ContentModerationResult | null> {
    try {
      const { data, error } = await supabase
        .from('content_moderation_results')
        .select('*')
        .eq('id', moderationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting moderation result:', error);
      throw error;
    }
  }

  /**
   * Get user's moderation history
   */
  async getUserModerationHistory(
    userId: string,
    limit: number = 50
  ): Promise<ContentModerationResult[]> {
    try {
      const { data, error } = await supabase
        .from('content_moderation_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user moderation history:', error);
      throw error;
    }
  }

  /**
   * Submit an appeal for a moderation action
   */
  async submitAppeal(
    userId: string,
    moderationActionId: string,
    appealText: string,
    evidenceUrls: string[] = []
  ): Promise<UserAppeal> {
    try {
      const { data, error } = await supabase
        .from('user_appeals')
        .insert({
          user_id: userId,
          moderation_action_id: moderationActionId,
          appeal_text: appealText,
          user_evidence_urls: evidenceUrls,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error submitting appeal:', error);
      throw error;
    }
  }

  /**
   * Get user's appeals
   */
  async getUserAppeals(userId: string): Promise<UserAppeal[]> {
    try {
      const { data, error } = await supabase
        .from('user_appeals')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user appeals:', error);
      throw error;
    }
  }

  /**
   * Check if content contains tampered/manipulated elements
   */
  async checkImageTampering(imageUrl: string): Promise<{
    is_tampered: boolean;
    confidence: number;
    detected_manipulations: string[];
  }> {
    try {
      // This would typically use a service like:
      // - Adobe's Content Authenticity Initiative
      // - Microsoft's Project Origin
      // - Blockchain-based verification
      // For now, we'll use a simplified check based on metadata and basic analysis

      const response = await fetch(imageUrl, { method: 'HEAD' });
      const headers = response.headers;
      
      // Check for suspicious headers or metadata
      const suspiciousIndicators: string[] = [];
      
      // Check file size (too small for quality might indicate heavy compression)
      const contentLength = parseInt(headers.get('content-length') || '0');
      if (contentLength < 50000) { // Less than 50KB might be suspicious for high-quality images
        suspiciousIndicators.push('unusually_small_file_size');
      }

      // Check content type
      const contentType = headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        suspiciousIndicators.push('invalid_content_type');
      }

      // Basic confidence score based on indicators
      const confidence = suspiciousIndicators.length > 0 ? 0.3 + (suspiciousIndicators.length * 0.2) : 0.1;

      return {
        is_tampered: suspiciousIndicators.length > 0,
        confidence: Math.min(confidence, 1.0),
        detected_manipulations: suspiciousIndicators
      };
    } catch (error) {
      console.error('Error checking image tampering:', error);
      return {
        is_tampered: false,
        confidence: 0,
        detected_manipulations: []
      };
    }
  }

  /**
   * Get blocked terms for reference
   */
  async getBlockedTerms(): Promise<Array<{
    term: string;
    category: string;
    severity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('blocked_content_terms')
        .select('term, category, severity')
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting blocked terms:', error);
      return [];
    }
  }

  /**
   * Report content for manual review
   */
  async reportContent(
    contentId: string,
    contentType: string,
    reportingUserId: string,
    reason: string,
    additionalInfo?: string
  ): Promise<boolean> {
    try {
      // Check if content was already moderated
      const { data: existing } = await supabase
        .from('content_moderation_results')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      if (existing) {
        // Add to moderation queue for review
        await supabase
          .from('moderation_queue')
          .insert({
            content_moderation_id: existing.id,
            priority: 2, // User reports get higher priority
            sla_deadline: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
          });
      } else {
        // Create new moderation entry and add to queue
        const moderationResult = await this.moderateContent({
          contentId,
          contentType: contentType as any,
          userId: reportingUserId,
          metadata: {
            user_reported: true,
            report_reason: reason,
            additional_info: additionalInfo
          }
        });

        // Force human review for user reports
        await supabase
          .from('content_moderation_results')
          .update({ human_review_required: true })
          .eq('id', moderationResult.moderation_id);
      }

      return true;
    } catch (error) {
      console.error('Error reporting content:', error);
      return false;
    }
  }

  /**
   * Check if user is currently restricted
   */
  async getUserRestrictions(userId: string): Promise<{
    is_shadow_banned: boolean;
    is_suspended: boolean;
    is_banned: boolean;
    restrictions: Array<{
      type: string;
      reason: string;
      expires_at?: string;
    }>;
  }> {
    try {
      // Check active moderation actions against user
      const { data: actions, error } = await supabase
        .from('moderation_actions')
        .select(`
          action_type,
          reason,
          expires_at,
          content_moderation_results!inner(user_id)
        `)
        .eq('content_moderation_results.user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const restrictions = actions || [];
      
      return {
        is_shadow_banned: restrictions.some(a => a.action_type === 'shadow_ban'),
        is_suspended: restrictions.some(a => a.action_type === 'suspend_user'),
        is_banned: restrictions.some(a => a.action_type === 'ban_user'),
        restrictions: restrictions.map(a => ({
          type: a.action_type,
          reason: a.reason,
          expires_at: a.expires_at
        }))
      };
    } catch (error) {
      console.error('Error checking user restrictions:', error);
      return {
        is_shadow_banned: false,
        is_suspended: false,
        is_banned: false,
        restrictions: []
      };
    }
  }
}

export const moderationService = new ModerationService();