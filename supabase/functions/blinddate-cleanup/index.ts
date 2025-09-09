import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting blind date cleanup...');
    
    const cleanupResults = await performCleanup(supabaseClient);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        results: cleanupResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function performCleanup(supabaseClient: any) {
  const results = {
    expiredSessions: 0,
    expiredShares: 0,
    oldWaitingSessions: 0,
    orphanedParticipants: 0,
    orphanedDesigns: 0
  };

  // 1. Archive waiting sessions older than 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const { data: oldWaitingSessions, error: waitingError } = await supabaseClient
    .from('blinddate_sessions')
    .update({ status: 'finished', ended_at: new Date().toISOString() })
    .eq('status', 'waiting')
    .lt('created_at', tenMinutesAgo.toISOString())
    .select('id');

  if (!waitingError && oldWaitingSessions) {
    results.oldWaitingSessions = oldWaitingSessions.length;
    console.log(`Archived ${oldWaitingSessions.length} old waiting sessions`);
  }

  // 2. Delete expired share content (auto-delete after 24 hours)
  const { error: sharesError } = await supabaseClient.rpc('cleanup_expired_shares');
  
  if (!sharesError) {
    // Get count of deleted shares
    const { count } = await supabaseClient
      .from('blinddate_shares')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());
    
    results.expiredShares = count || 0;
    console.log(`Cleaned up ${results.expiredShares} expired shares`);
  }

  // 3. Archive finished sessions older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: expiredSessions, error: expiredError } = await supabaseClient
    .from('blinddate_sessions')
    .delete()
    .eq('status', 'finished')
    .lt('ended_at', sevenDaysAgo.toISOString())
    .select('id');

  if (!expiredError && expiredSessions) {
    results.expiredSessions = expiredSessions.length;
    console.log(`Deleted ${expiredSessions.length} expired sessions`);
  }

  // 4. Clean up orphaned participants (sessions that no longer exist)
  const { data: orphanedParticipants, error: participantsError } = await supabaseClient
    .from('blinddate_participants')
    .delete()
    .not('session_id', 'in', 
      `(SELECT id FROM blinddate_sessions WHERE status IN ('waiting', 'active', 'reveal', 'finished'))`
    )
    .select('session_id');

  if (!participantsError && orphanedParticipants) {
    results.orphanedParticipants = orphanedParticipants.length;
    console.log(`Cleaned up ${orphanedParticipants.length} orphaned participants`);
  }

  // 5. Clean up orphaned designs
  const { data: orphanedDesigns, error: designsError } = await supabaseClient
    .from('blinddate_designs')
    .delete()
    .not('session_id', 'in', 
      `(SELECT id FROM blinddate_sessions WHERE status IN ('waiting', 'active', 'reveal', 'finished'))`
    )
    .select('session_id');

  if (!designsError && orphanedDesigns) {
    results.orphanedDesigns = orphanedDesigns.length;
    console.log(`Cleaned up ${orphanedDesigns.length} orphaned designs`);
  }

  // 6. Update session statistics (optional)
  await updateSessionStats(supabaseClient);

  return results;
}

async function updateSessionStats(supabaseClient: any) {
  try {
    // Update session statistics for queue ETA calculations
    const { data: recentSessions } = await supabaseClient
      .from('blinddate_sessions')
      .select('created_at, status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active');

    if (recentSessions && recentSessions.length > 0) {
      // Calculate average match time and store in a stats table if needed
      console.log(`Found ${recentSessions.length} recent active sessions for stats`);
    }
  } catch (error) {
    console.error('Stats update error:', error);
  }
}

// This function should be called periodically via:
// 1. Supabase Cron Jobs (pg_cron extension)
// 2. External cron service calling this endpoint
// 3. Vercel Cron Jobs (if deployed there)
// 
// Example cron schedule: every 10 minutes