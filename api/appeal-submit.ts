import { NextRequest, NextResponse } from 'next/server';
import { moderationService } from '@/services/moderationService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      moderationActionId,
      appealText,
      evidenceUrls = []
    } = body;

    // Validate required fields
    if (!moderationActionId || !appealText) {
      return NextResponse.json(
        { error: 'Missing required fields: moderationActionId, appealText' },
        { status: 400 }
      );
    }

    // Validate appeal text length (minimum 50 characters, maximum 2000)
    if (appealText.length < 50) {
      return NextResponse.json(
        { error: 'Appeal text must be at least 50 characters long' },
        { status: 400 }
      );
    }

    if (appealText.length > 2000) {
      return NextResponse.json(
        { error: 'Appeal text must not exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Validate evidence URLs (max 5 URLs)
    if (evidenceUrls.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 evidence URLs allowed' },
        { status: 400 }
      );
    }

    // Validate URL format for evidence URLs
    for (const url of evidenceUrls) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid evidence URL format' },
          { status: 400 }
        );
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
        created_at,
        content_moderation_results!inner(user_id)
      `)
      .eq('id', moderationActionId)
      .eq('content_moderation_results.user_id', user.id)
      .single();

    if (actionError || !moderationAction) {
      return NextResponse.json(
        { error: 'Moderation action not found or access denied' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { 
          error: 'Appeal already submitted for this action',
          existing_appeal: existingAppeal
        },
        { status: 409 }
      );
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
      return NextResponse.json(
        { error: 'Daily appeal limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // Submit the appeal
    const appeal = await moderationService.submitAppeal(
      user.id,
      moderationActionId,
      appealText,
      evidenceUrls
    );

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
        ip_address: req.ip,
        user_agent: req.headers.get('user-agent'),
        risk_score: 0,
        flagged: false
      });

    // Send notification to moderation team (in a real app, this might be an email or Slack notification)
    // For now, we'll just log it
    console.log(`New appeal submitted: ${appeal.id} for action: ${moderationActionId}`);

    return NextResponse.json({
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
    
    return NextResponse.json({
      error: 'Failed to submit appeal. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get user's appeals
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's appeals with related moderation action details
    const { data: appeals, error } = await supabase
      .from('user_appeals')
      .select(`
        *,
        moderation_actions!inner(
          action_type,
          reason,
          public_reason,
          created_at,
          content_moderation_results!inner(
            content_type,
            content_id
          )
        )
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      appeals: appeals || [],
      count: appeals?.length || 0
    });

  } catch (error) {
    console.error('Get appeals error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch appeals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}