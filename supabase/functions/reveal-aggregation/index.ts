import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Reveal Aggregation Edge Function
 * Optimized for global distribution and high-performance reveal processing
 * Handles multiple concurrent reveals with caching and rate limiting
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5min cache with 1min stale
};

// Performance configuration
const REVEAL_CONFIG = {
  MAX_CONCURRENT_REVEALS: 10,
  CACHE_TTL_SECONDS: 300, // 5 minutes
  RATE_LIMIT_PER_MINUTE: 30,
  BATCH_SIZE: 50,
  PROCESSING_TIMEOUT_MS: 45000, // 45 seconds
  EDGE_CACHE_KEY_PREFIX: 'reveal_cache:',
};

// In-memory cache for edge performance (shared across requests)
const revealCache = new Map<string, {
  data: any;
  expires: number;
  etag: string;
}>();

// Rate limiting tracker
const rateLimiter = new Map<string, {
  count: number;
  resetTime: number;
}>();

// Active processing tracker to prevent duplicate work
const processingTracker = new Set<string>();

interface RevealRequest {
  action: 'get_reveals' | 'process_reveal' | 'batch_reveal';
  session_id: string;
  user_id?: string;
  force_refresh?: boolean;
  include_analytics?: boolean;
  round_filter?: number[];
}

interface RevealResponse {
  success: boolean;
  data?: any;
  cached?: boolean;
  processing_time_ms?: number;
  cache_hit?: boolean;
  rate_limit?: {
    remaining: number;
    reset_time: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    console.log(`[${requestId}] Reveal request received`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const { action, session_id, user_id, force_refresh, include_analytics, round_filter }: RevealRequest = await req.json();
    
    if (!session_id) {
      throw new Error('session_id is required');
    }

    // Rate limiting check
    const clientId = getClientIdentifier(req, user_id);
    const rateLimitResult = checkRateLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          rate_limit: rateLimitResult
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    console.log(`[${requestId}] Processing ${action} for session ${session_id}`);

    let result: RevealResponse;

    switch (action) {
      case 'get_reveals':
        result = await getReveals(supabaseClient, session_id, {
          force_refresh,
          include_analytics,
          round_filter,
          request_id: requestId
        });
        break;
        
      case 'process_reveal':
        result = await processReveal(supabaseClient, session_id, user_id, requestId);
        break;
        
      case 'batch_reveal':
        result = await batchReveal(supabaseClient, session_id, requestId);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Add performance metrics
    result.processing_time_ms = Date.now() - startTime;
    result.rate_limit = {
      remaining: rateLimitResult.remaining,
      reset_time: rateLimitResult.reset_time
    };

    console.log(`[${requestId}] Completed in ${result.processing_time_ms}ms`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Processing-Time': result.processing_time_ms?.toString() || '0',
          'ETag': result.cached ? getCacheETag(session_id) : undefined
        }.filter(Boolean) as Record<string, string>
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        request_id: requestId,
        processing_time_ms: Date.now() - startTime
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );
  }
});

/**
 * Get reveals with intelligent caching
 */
async function getReveals(
  supabaseClient: any,
  sessionId: string,
  options: {
    force_refresh?: boolean;
    include_analytics?: boolean;
    round_filter?: number[];
    request_id: string;
  }
): Promise<RevealResponse> {
  const cacheKey = `${REVEAL_CONFIG.EDGE_CACHE_KEY_PREFIX}${sessionId}`;
  const now = Date.now();
  
  // Check cache first (unless force refresh)
  if (!options.force_refresh) {
    const cached = revealCache.get(cacheKey);
    if (cached && cached.expires > now) {
      console.log(`[${options.request_id}] Cache hit for session ${sessionId}`);
      
      let data = cached.data;
      
      // Apply round filter if specified
      if (options.round_filter && options.round_filter.length > 0) {
        data = {
          ...data,
          reveals: data.reveals?.filter((reveal: any) => 
            options.round_filter!.includes(reveal.round_no)
          )
        };
      }
      
      return {
        success: true,
        data,
        cached: true,
        cache_hit: true
      };
    }
  }

  // Check if already processing to prevent duplicate work
  if (processingTracker.has(sessionId)) {
    console.log(`[${options.request_id}] Already processing ${sessionId}, waiting...`);
    
    // Wait for up to 10 seconds for processing to complete
    for (let i = 0; i < 100; i++) {
      if (!processingTracker.has(sessionId)) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Try cache again after waiting
    const cached = revealCache.get(cacheKey);
    if (cached && cached.expires > now) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        cache_hit: true
      };
    }
  }

  // Mark as processing
  processingTracker.add(sessionId);

  try {
    console.log(`[${options.request_id}] Fetching fresh data for session ${sessionId}`);
    
    // Optimized query with joins
    const { data: reveals, error } = await supabaseClient
      .from('blinddate_designs')
      .select(`
        *,
        blinddate_rounds(round_no, topic, time_limit_seconds),
        blinddate_participants!target_user_id(avatar_name, role),
        blinddate_participants!created_by(avatar_name as creator_avatar, role as creator_role)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Process and aggregate reveals
    const processedData = await aggregateRevealData(supabaseClient, sessionId, reveals, {
      include_analytics: options.include_analytics
    });

    // Apply round filter
    if (options.round_filter && options.round_filter.length > 0) {
      processedData.reveals = processedData.reveals.filter((reveal: any) => 
        options.round_filter!.includes(reveal.round_no)
      );
    }

    // Cache the result
    const etag = generateETag(processedData);
    revealCache.set(cacheKey, {
      data: processedData,
      expires: now + (REVEAL_CONFIG.CACHE_TTL_SECONDS * 1000),
      etag
    });

    // Clean up old cache entries (simple LRU)
    if (revealCache.size > 1000) {
      const oldestKey = revealCache.keys().next().value;
      revealCache.delete(oldestKey);
    }

    return {
      success: true,
      data: processedData,
      cached: false,
      cache_hit: false
    };

  } finally {
    processingTracker.delete(sessionId);
  }
}

/**
 * Process single reveal with optimizations
 */
async function processReveal(
  supabaseClient: any,
  sessionId: string,
  userId?: string,
  requestId?: string
): Promise<RevealResponse> {
  console.log(`[${requestId}] Processing reveal for session ${sessionId}`);

  // Get session status
  const { data: session, error: sessionError } = await supabaseClient
    .from('blinddate_sessions')
    .select('status, reveal_processed')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  if (session.reveal_processed) {
    // Already processed, return cached result
    return await getReveals(supabaseClient, sessionId, { request_id: requestId || '' });
  }

  // Mark as processing reveal
  const { error: updateError } = await supabaseClient
    .from('blinddate_sessions')
    .update({ 
      reveal_processed: true,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (updateError) throw updateError;

  // Invalidate cache
  const cacheKey = `${REVEAL_CONFIG.EDGE_CACHE_KEY_PREFIX}${sessionId}`;
  revealCache.delete(cacheKey);

  // Broadcast reveal event
  await broadcastRevealEvent(supabaseClient, sessionId, 'reveals_ready');

  // Return fresh data
  return await getReveals(supabaseClient, sessionId, { 
    force_refresh: true,
    request_id: requestId || ''
  });
}

/**
 * Batch reveal processing for multiple sessions
 */
async function batchReveal(
  supabaseClient: any,
  sessionId: string,
  requestId: string
): Promise<RevealResponse> {
  console.log(`[${requestId}] Batch reveal processing`);

  // Get related sessions that need processing
  const { data: sessions, error } = await supabaseClient
    .from('blinddate_sessions')
    .select('id')
    .eq('status', 'active')
    .eq('reveal_processed', false)
    .limit(REVEAL_CONFIG.BATCH_SIZE);

  if (error) throw error;

  const results = await Promise.allSettled(
    sessions.map(async (session: any) => {
      return processReveal(supabaseClient, session.id, undefined, requestId);
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return {
    success: true,
    data: {
      processed_sessions: sessions.length,
      successful,
      failed,
      batch_id: requestId
    }
  };
}

/**
 * Aggregate reveal data with analytics
 */
async function aggregateRevealData(
  supabaseClient: any,
  sessionId: string,
  reveals: any[],
  options: { include_analytics?: boolean }
): Promise<any> {
  // Group reveals by round and participant
  const roundGroups = reveals.reduce((acc, reveal) => {
    const roundNo = reveal.blinddate_rounds?.round_no || 0;
    if (!acc[roundNo]) acc[roundNo] = [];
    acc[roundNo].push(reveal);
    return acc;
  }, {});

  // Calculate statistics if analytics requested
  let analytics = undefined;
  if (options.include_analytics) {
    analytics = await calculateRevealAnalytics(reveals, roundGroups);
  }

  // Get participant info
  const { data: participants } = await supabaseClient
    .from('blinddate_participants')
    .select('user_id, role, avatar_name')
    .eq('session_id', sessionId);

  return {
    session_id: sessionId,
    reveals: reveals.map(reveal => ({
      id: reveal.id,
      round_no: reveal.blinddate_rounds?.round_no,
      topic: reveal.blinddate_rounds?.topic,
      target_role: reveal.target_role,
      prompt: reveal.prompt,
      image_url: reveal.image_url,
      created_at: reveal.created_at,
      creator: reveal.blinddate_participants?.[0] || {},
      target: reveal.blinddate_participants?.[1] || {}
    })),
    participants: participants || [],
    round_summary: Object.keys(roundGroups).map(roundNo => ({
      round_no: parseInt(roundNo),
      total_designs: roundGroups[roundNo].length,
      topics: [...new Set(roundGroups[roundNo].map((r: any) => r.blinddate_rounds?.topic))]
    })),
    analytics,
    processed_at: new Date().toISOString(),
    cache_version: '2.0'
  };
}

/**
 * Calculate reveal analytics
 */
async function calculateRevealAnalytics(reveals: any[], roundGroups: any): Promise<any> {
  const totalDesigns = reveals.length;
  const roundCount = Object.keys(roundGroups).length;
  
  // Design distribution
  const designsByRole = reveals.reduce((acc, reveal) => {
    acc[reveal.target_role] = (acc[reveal.target_role] || 0) + 1;
    return acc;
  }, {});

  // Average response time (mock calculation)
  const avgResponseTime = reveals.reduce((sum, reveal, idx) => {
    return sum + (idx * 15000); // Mock: 15s per design
  }, 0) / totalDesigns;

  // Popular topics
  const topicCounts = reveals.reduce((acc, reveal) => {
    const topic = reveal.blinddate_rounds?.topic;
    if (topic) acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});

  return {
    total_designs: totalDesigns,
    round_count: roundCount,
    designs_by_role: designsByRole,
    avg_response_time_ms: Math.round(avgResponseTime),
    popular_topics: Object.entries(topicCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3),
    completion_rate: roundCount > 0 ? (totalDesigns / (roundCount * 2)) : 0
  };
}

/**
 * Broadcast reveal events
 */
async function broadcastRevealEvent(
  supabaseClient: any, 
  sessionId: string, 
  event: string, 
  payload?: any
): Promise<void> {
  try {
    await supabaseClient
      .channel(`blinddate:session:${sessionId}`)
      .send({
        type: 'broadcast',
        event: event,
        payload: {
          timestamp: new Date().toISOString(),
          ...payload
        }
      });
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientId: string): {
  allowed: boolean;
  remaining: number;
  reset_time: number;
} {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // 1-minute windows
  const resetTime = windowStart + 60000;

  let clientData = rateLimiter.get(clientId);
  
  if (!clientData || clientData.resetTime <= now) {
    clientData = {
      count: 0,
      resetTime: resetTime
    };
    rateLimiter.set(clientId, clientData);
  }

  clientData.count++;
  const remaining = Math.max(0, REVEAL_CONFIG.RATE_LIMIT_PER_MINUTE - clientData.count);
  
  return {
    allowed: clientData.count <= REVEAL_CONFIG.RATE_LIMIT_PER_MINUTE,
    remaining,
    reset_time: resetTime
  };
}

/**
 * Utility functions
 */
function getClientIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return `ip:${ip}`;
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateETag(data: any): string {
  const hash = new TextEncoder().encode(JSON.stringify(data));
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

function getCacheETag(sessionId: string): string {
  const cacheKey = `${REVEAL_CONFIG.EDGE_CACHE_KEY_PREFIX}${sessionId}`;
  return revealCache.get(cacheKey)?.etag || '';
}

/* To deploy this function:
 * npx supabase functions deploy reveal-aggregation --no-verify-jwt
 */