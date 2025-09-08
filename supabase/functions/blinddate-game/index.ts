import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameAction {
  action: 'get_session' | 'submit_design' | 'advance_round' | 'reveal_results' | 'add_reaction';
  session_id: string;
  round_id?: string;
  design_data?: {
    target_role: 'A' | 'B';
    prompt: any;
    image_url?: string;
  };
  reaction_data?: {
    vote?: 'A' | 'B' | 'tie';
    reaction?: 'heart' | 'fire' | 'laugh' | 'surprise';
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { action, session_id, round_id, design_data, reaction_data }: GameAction = await req.json();

    switch (action) {
      case 'get_session':
        return await getSessionData(supabaseClient, user.id, session_id);
      
      case 'submit_design':
        return await submitDesign(supabaseClient, user.id, session_id, round_id!, design_data!);
      
      case 'advance_round':
        return await advanceRound(supabaseClient, user.id, session_id);
      
      case 'reveal_results':
        return await revealResults(supabaseClient, user.id, session_id);
      
      case 'add_reaction':
        return await addReaction(supabaseClient, user.id, session_id, reaction_data!);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function getSessionData(supabaseClient: any, userId: string, sessionId: string) {
  // Verify user is participant in this session
  const { data: participation, error: participationError } = await supabaseClient
    .from('blinddate_participants')
    .select('role, avatar_name, is_revealed')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (participationError || !participation) {
    throw new Error('Not a participant in this session');
  }

  // Get session details
  const { data: session, error: sessionError } = await supabaseClient
    .from('blinddate_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  // Get all participants
  const { data: participants, error: participantsError } = await supabaseClient
    .from('blinddate_participants')
    .select('role, avatar_name, is_revealed, user_id')
    .eq('session_id', sessionId);

  if (participantsError) throw participantsError;

  // Get rounds
  const { data: rounds, error: roundsError } = await supabaseClient
    .from('blinddate_rounds')
    .select('*')
    .eq('session_id', sessionId)
    .order('round_no');

  if (roundsError) throw roundsError;

  // Get current round designs (only if in reveal/finished status)
  let designs = [];
  if (session.status === 'reveal' || session.status === 'finished') {
    const { data: designsData, error: designsError } = await supabaseClient
      .from('blinddate_designs')
      .select(`
        *,
        designer:profiles(full_name),
        round:blinddate_rounds(topic, round_no)
      `)
      .eq('session_id', sessionId);

    if (!designsError) designs = designsData || [];
  }

  // Get current round info
  const currentRound = rounds?.find(r => !r.ended_at) || rounds?.[rounds.length - 1];

  // Get my designs for current round (user can see their own designs)
  const { data: myDesigns, error: myDesignsError } = await supabaseClient
    .from('blinddate_designs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('designer_user_id', userId);

  return new Response(
    JSON.stringify({
      session,
      my_role: participation.role,
      my_avatar_name: participation.avatar_name,
      participants: participants.map(p => ({
        role: p.role,
        avatar_name: p.avatar_name,
        is_revealed: p.is_revealed,
        is_me: p.user_id === userId
      })),
      rounds,
      current_round: currentRound,
      designs: session.status === 'reveal' || session.status === 'finished' ? designs : [],
      my_designs: myDesignsError ? [] : myDesigns
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function submitDesign(supabaseClient: any, userId: string, sessionId: string, roundId: string, designData: any) {
  // Verify user is participant and round is active
  const { data: participation, error: participationError } = await supabaseClient
    .from('blinddate_participants')
    .select('role')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (participationError || !participation) {
    throw new Error('Not a participant in this session');
  }

  // Check if round exists and is active
  const { data: round, error: roundError } = await supabaseClient
    .from('blinddate_rounds')
    .select('*')
    .eq('id', roundId)
    .eq('session_id', sessionId)
    .single();

  if (roundError || !round) {
    throw new Error('Round not found');
  }

  if (round.ended_at) {
    throw new Error('Round has already ended');
  }

  // Check if user already submitted design for this round and target
  const { data: existingDesign } = await supabaseClient
    .from('blinddate_designs')
    .select('id')
    .eq('session_id', sessionId)
    .eq('round_id', roundId)
    .eq('designer_user_id', userId)
    .eq('target_role', designData.target_role)
    .single();

  if (existingDesign) {
    // Update existing design
    const { error: updateError } = await supabaseClient
      .from('blinddate_designs')
      .update({
        prompt: designData.prompt,
        image_url: designData.image_url
      })
      .eq('id', existingDesign.id);

    if (updateError) throw updateError;
  } else {
    // Create new design
    const { error: insertError } = await supabaseClient
      .from('blinddate_designs')
      .insert({
        session_id: sessionId,
        round_id: roundId,
        designer_user_id: userId,
        target_role: designData.target_role,
        prompt: designData.prompt,
        image_url: designData.image_url
      });

    if (insertError) throw insertError;
  }

  return new Response(
    JSON.stringify({ message: 'Design submitted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function advanceRound(supabaseClient: any, userId: string, sessionId: string) {
  // Get current round
  const { data: currentRound, error: roundError } = await supabaseClient
    .from('blinddate_rounds')
    .select('*')
    .eq('session_id', sessionId)
    .is('ended_at', null)
    .order('round_no')
    .limit(1)
    .single();

  if (roundError || !currentRound) {
    // No active round, move to reveal
    return await revealResults(supabaseClient, userId, sessionId);
  }

  // End current round
  const { error: endRoundError } = await supabaseClient
    .from('blinddate_rounds')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', currentRound.id);

  if (endRoundError) throw endRoundError;

  // Check if there are more rounds
  const { data: nextRound, error: nextRoundError } = await supabaseClient
    .from('blinddate_rounds')
    .select('*')
    .eq('session_id', sessionId)
    .gt('round_no', currentRound.round_no)
    .order('round_no')
    .limit(1)
    .single();

  if (nextRoundError || !nextRound) {
    // No more rounds, move to reveal
    return await revealResults(supabaseClient, userId, sessionId);
  }

  return new Response(
    JSON.stringify({
      message: 'Round advanced',
      next_round: nextRound
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function revealResults(supabaseClient: any, userId: string, sessionId: string) {
  // Update session status to reveal
  const { error: updateError } = await supabaseClient
    .from('blinddate_sessions')
    .update({ status: 'reveal' })
    .eq('id', sessionId);

  if (updateError) throw updateError;

  // Get all designs for the session
  const { data: designs, error: designsError } = await supabaseClient
    .from('blinddate_designs')
    .select(`
      *,
      designer:profiles(full_name, avatar_url),
      round:blinddate_rounds(topic, round_no)
    `)
    .eq('session_id', sessionId)
    .order('blinddate_rounds.round_no');

  if (designsError) throw designsError;

  return new Response(
    JSON.stringify({
      message: 'Results revealed',
      designs: designs || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function addReaction(supabaseClient: any, userId: string, sessionId: string, reactionData: any) {
  // Verify user is participant
  const { data: participation, error: participationError } = await supabaseClient
    .from('blinddate_participants')
    .select('role')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (participationError || !participation) {
    throw new Error('Not a participant in this session');
  }

  // Check if user already gave feedback for this session
  const { data: existingFeedback } = await supabaseClient
    .from('blinddate_feedback')
    .select('id')
    .eq('session_id', sessionId)
    .eq('voter_user_id', userId)
    .single();

  if (existingFeedback) {
    // Update existing feedback
    const { error: updateError } = await supabaseClient
      .from('blinddate_feedback')
      .update({
        vote: reactionData.vote,
        reaction: reactionData.reaction
      })
      .eq('id', existingFeedback.id);

    if (updateError) throw updateError;
  } else {
    // Create new feedback
    const { error: insertError } = await supabaseClient
      .from('blinddate_feedback')
      .insert({
        session_id: sessionId,
        voter_user_id: userId,
        vote: reactionData.vote,
        reaction: reactionData.reaction
      });

    if (insertError) throw insertError;
  }

  return new Response(
    JSON.stringify({ message: 'Reaction added successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/* To deploy this function run:
 * npx supabase functions deploy blinddate-game --no-verify-jwt
 */