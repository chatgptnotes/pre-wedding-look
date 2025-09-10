import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      contentId,
      contentType,
      contentText,
      imageUrl,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!contentId || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields: contentId, contentType'
      });
    }

    // Validate content type
    const validContentTypes = ['reel', 'profile_image', 'comment', 'prompt'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid content type'
      });
    }

    // Rate limiting check - max 100 moderation checks per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentChecks, error: rateLimitError } = await supabase
      .from('content_moderation_results')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo.toISOString());

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Continue anyway - don't fail on rate limit check errors
    } else if (recentChecks && recentChecks.length >= 100) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    // Simple content moderation logic (replace with actual service)
    const moderationResult = {
      moderation_id: `mod_${Date.now()}`,
      requires_review: false,
      risk_score: Math.random() * 0.2, // Low risk by default
      blocked_terms: [],
      auto_action: null,
      is_blocked: false
    };

    // Check for obvious problematic content
    if (contentText) {
      const lowercaseText = contentText.toLowerCase();
      const blockedTerms = ['spam', 'scam', 'fake', 'illegal'];
      const foundTerms = blockedTerms.filter(term => lowercaseText.includes(term));
      
      if (foundTerms.length > 0) {
        moderationResult.blocked_terms = foundTerms;
        moderationResult.risk_score = 0.8;
        moderationResult.requires_review = true;
        moderationResult.is_blocked = true;
      }
    }

    // Log the moderation check for audit purposes
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'content_moderation',
        user_id: user.id,
        description: `Content moderation check for ${contentType}`,
        metadata: {
          content_id: contentId,
          content_type: contentType,
          risk_score: moderationResult.risk_score,
          auto_action: moderationResult.auto_action,
          blocked_terms: moderationResult.blocked_terms
        },
        risk_score: moderationResult.risk_score,
        flagged: moderationResult.is_blocked
      })
      .then(() => {
        // Success - audit logged
      })
      .catch((error) => {
        console.error('Failed to log audit entry:', error);
        // Don't fail the main request for audit logging issues
      });

    return res.status(200).json({
      ...moderationResult,
      user_restrictions: {
        is_shadow_banned: false,
        has_restrictions: false
      }
    });

  } catch (error) {
    console.error('Moderation check error:', error);
    
    // Return a safe default response on error
    return res.status(500).json({
      moderation_id: null,
      requires_review: false,
      risk_score: 0,
      blocked_terms: [],
      auto_action: null,
      is_blocked: false,
      error: 'Moderation service temporarily unavailable'
    });
  }
}