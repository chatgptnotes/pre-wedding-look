import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGetAppeals(req, res);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return handleSubmitAppeal(req, res);
}

async function handleSubmitAppeal(req: VercelRequest, res: VercelResponse) {
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
      moderationActionId,
      appealText,
      evidenceUrls = []
    } = req.body;

    // Validate required fields
    if (!moderationActionId || !appealText) {
      return res.status(400).json({
        error: 'Missing required fields: moderationActionId, appealText'
      });
    }

    // Validate appeal text length (minimum 50 characters, maximum 2000)
    if (appealText.length < 50) {
      return res.status(400).json({
        error: 'Appeal text must be at least 50 characters long'
      });
    }

    if (appealText.length > 2000) {
      return res.status(400).json({
        error: 'Appeal text must not exceed 2000 characters'
      });
    }

    // Validate evidence URLs (max 5 URLs)
    if (evidenceUrls.length > 5) {
      return res.status(400).json({
        error: 'Maximum 5 evidence URLs allowed'
      });
    }

    // Validate URL format for evidence URLs
    for (const url of evidenceUrls) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          error: 'Invalid evidence URL format'
        });
      }
    }

    // Check if moderation action exists and belongs to user
    const { data: moderationAction, error: actionError } = await supabase
      .from('moderation_actions')
      .select(`
        id,
        action_type,
        reason,
        public_reason,
        created_at
      `)
      .eq('id', moderationActionId)
      .single();

    if (actionError || !moderationAction) {
      return res.status(404).json({
        error: 'Moderation action not found or access denied'
      });
    }

    // Check if user has already submitted an appeal for this action
    const { data: existingAppeal, error: existingError } = await supabase
      .from('user_appeals')
      .select('id, status')
      .eq('moderation_action_id', moderationActionId)
      .eq('user_id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingAppeal) {
      return res.status(409).json({
        error: 'Appeal already submitted for this action',
        existing_appeal: existingAppeal
      });
    }

    // Rate limiting - max 3 appeals per day per user
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recentAppeals, error: rateLimitError } = await supabase
      .from('user_appeals')
      .select('id')
      .eq('user_id', user.id)
      .gte('submitted_at', twentyFourHoursAgo.toISOString());

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Continue anyway - don't fail on rate limit check errors
    } else if (recentAppeals && recentAppeals.length >= 3) {
      return res.status(429).json({
        error: 'Daily appeal limit exceeded. Please try again tomorrow.'
      });
    }

    // Submit the appeal
    const { data: appeal, error: appealError } = await supabase
      .from('user_appeals')
      .insert({
        user_id: user.id,
        moderation_action_id: moderationActionId,
        appeal_text: appealText,
        evidence_urls: evidenceUrls,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (appealError) {
      throw appealError;
    }

    // Log the appeal submission for audit purposes
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'appeal_submitted',
        user_id: user.id,
        description: `User submitted appeal for moderation action`,
        metadata: {
          appeal_id: appeal.id,
          moderation_action_id: moderationActionId,
          action_type: moderationAction.action_type,
          appeal_text_length: appealText.length,
          evidence_count: evidenceUrls.length
        },
        risk_score: 0,
        flagged: false
      })
      .then(() => {
        // Success - audit logged
      })
      .catch((error) => {
        console.error('Failed to log audit entry:', error);
        // Don't fail the main request for audit logging issues
      });

    // Send notification to moderation team (in a real app, this might be an email or Slack notification)
    // For now, we'll just log it
    console.log(`New appeal submitted: ${appeal.id} for action: ${moderationActionId}`);

    return res.status(200).json({
      success: true,
      appeal: {
        id: appeal.id,
        status: appeal.status,
        submitted_at: appeal.submitted_at,
        estimated_response_time: '2-3 business days'
      }
    });

  } catch (error) {
    console.error('Appeal submission error:', error);
    
    return res.status(500).json({
      error: 'Failed to submit appeal. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetAppeals(req: VercelRequest, res: VercelResponse) {
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

    // Get user's appeals with related moderation action details
    const { data: appeals, error } = await supabase
      .from('user_appeals')
      .select(`
        *,
        moderation_actions(
          action_type,
          reason,
          public_reason,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      appeals: appeals || [],
      count: appeals?.length || 0
    });

  } catch (error) {
    console.error('Get appeals error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch appeals',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}