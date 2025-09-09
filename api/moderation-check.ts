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
      contentId,
      contentType,
      contentText,
      imageUrl,
      metadata = {}
    } = body;

    // Validate required fields
    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, contentType' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['reel', 'profile_image', 'comment', 'prompt'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user is currently restricted
    const userRestrictions = await moderationService.getUserRestrictions(user.id);
    
    if (userRestrictions.is_banned) {
      return NextResponse.json(
        { error: 'Account is banned', is_blocked: true },
        { status: 403 }
      );
    }

    if (userRestrictions.is_suspended) {
      return NextResponse.json(
        { error: 'Account is temporarily suspended', is_blocked: true },
        { status: 403 }
      );
    }

    // Perform content moderation
    const moderationRequest = {
      contentId,
      contentType: contentType as 'reel' | 'profile_image' | 'comment' | 'prompt',
      userId: user.id,
      contentText,
      imageUrl,
      metadata
    };

    let result;
    
    // Use enhanced moderation for high-risk content types or when explicitly requested
    const useEnhanced = metadata.enhanced || contentType === 'profile_image';
    
    if (useEnhanced) {
      result = await moderationService.moderateContentEnhanced(moderationRequest);
    } else {
      result = await moderationService.moderateContent(moderationRequest);
    }

    // Additional checks for image content
    let tamperingCheck = null;
    if (imageUrl && result.risk_score > 0.3) {
      tamperingCheck = await moderationService.checkImageTampering(imageUrl);
    }

    // Apply shadow ban effects if user is shadow banned
    if (userRestrictions.is_shadow_banned) {
      // Shadow banned users think their content is approved but it's hidden
      result = {
        ...result,
        is_blocked: false,
        requires_review: false,
        risk_score: 0.1 // Low score to appear safe
      };
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
          risk_score: result.risk_score,
          auto_action: result.auto_action,
          blocked_terms: result.blocked_terms,
          tampering_check: tamperingCheck
        },
        ip_address: req.ip,
        user_agent: req.headers.get('user-agent'),
        risk_score: result.risk_score,
        flagged: result.is_blocked
      });

    return NextResponse.json({
      ...result,
      tampering_check: tamperingCheck,
      user_restrictions: {
        is_shadow_banned: userRestrictions.is_shadow_banned,
        has_restrictions: userRestrictions.restrictions.length > 0
      }
    });

  } catch (error) {
    console.error('Moderation check error:', error);
    
    // Return a safe default response on error
    return NextResponse.json({
      moderation_id: null,
      requires_review: false,
      risk_score: 0,
      blocked_terms: [],
      auto_action: null,
      is_blocked: false,
      error: 'Moderation service temporarily unavailable'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}