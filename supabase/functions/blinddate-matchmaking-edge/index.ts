import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { action, userId } = await req.json();

    switch (action) {
      case 'findMatch':
        return await findMatch(userId);
      
      case 'createSession':
        return await createSession(userId);
        
      case 'aggregateReveal':
        const { sessionId } = await req.json();
        return await aggregateRevealData(sessionId);
        
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

async function findMatch(userId: string) {
  // Find another user waiting for matchmaking
  const { data: waitingUsers } = await supabase
    .from('blinddate_sessions')
    .select('*, blinddate_participants(*)')
    .eq('status', 'matchmaking')
    .neq('created_by', userId)
    .order('created_at')
    .limit(1);

  if (waitingUsers && waitingUsers.length > 0) {
    // Match found - join existing session
    const session = waitingUsers[0];
    
    await supabase.from('blinddate_participants').insert({
      session_id: session.id,
      user_id: userId,
      role: 'player2'
    });

    await supabase
      .from('blinddate_sessions')
      .update({ status: 'active' })
      .eq('id', session.id);

    return new Response(
      JSON.stringify({ matched: true, sessionId: session.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // No match - create new session
  const { data: newSession } = await supabase
    .from('blinddate_sessions')
    .insert({
      created_by: userId,
      status: 'matchmaking',
      game_mode: 'quick_match'
    })
    .select()
    .single();

  await supabase.from('blinddate_participants').insert({
    session_id: newSession.id,
    user_id: userId,
    role: 'player1'
  });

  return new Response(
    JSON.stringify({ matched: false, sessionId: newSession.id }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function createSession(userId: string) {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data: session } = await supabase
    .from('blinddate_sessions')
    .insert({
      created_by: userId,
      status: 'waiting',
      invite_code: inviteCode,
      game_mode: 'private'
    })
    .select()
    .single();

  return new Response(
    JSON.stringify({ sessionId: session.id, inviteCode }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function aggregateRevealData(sessionId: string) {
  // Get all designs and feedback for the session
  const { data: participants } = await supabase
    .from('blinddate_participants')
    .select(`
      *,
      blinddate_round_designs(*),
      sent_feedback:blinddate_feedback!from_participant_id(*),
      received_feedback:blinddate_feedback!to_participant_id(*)
    `)
    .eq('session_id', sessionId);

  // Calculate scores and determine winner
  const scores = participants?.map(p => ({
    participantId: p.id,
    userId: p.user_id,
    totalVotes: p.received_feedback?.length || 0,
    bestOverall: p.received_feedback?.filter((f: any) => f.vote_type === 'best_overall').length || 0,
    mostCreative: p.received_feedback?.filter((f: any) => f.vote_type === 'most_creative').length || 0,
    mostRomantic: p.received_feedback?.filter((f: any) => f.vote_type === 'most_romantic').length || 0
  }));

  // Determine winner
  const winner = scores?.reduce((prev, current) => 
    (current.totalVotes > prev.totalVotes) ? current : prev
  );

  // Update winner status
  if (winner) {
    await supabase
      .from('blinddate_participants')
      .update({ is_winner: true })
      .eq('id', winner.participantId);
  }

  return new Response(
    JSON.stringify({ scores, winner }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}