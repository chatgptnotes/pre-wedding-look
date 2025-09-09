import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchmakingRequest {
  action: 'join' | 'create_private' | 'leave';
  invite_code?: string;
  preferences?: {
    preferred_gender?: 'male' | 'female' | 'any';
    age_range?: [number, number];
    region?: string;
  };
}

interface GameSession {
  id: string;
  status: 'waiting' | 'active' | 'reveal' | 'finished';
  is_private: boolean;
  invite_code?: string;
  created_at: string;
  ended_at?: string;
}

interface Participant {
  session_id: string;
  user_id: string;
  role: 'A' | 'B';
  joined_at: string;
  is_revealed: boolean;
  avatar_name: string;
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

    const { action, invite_code, preferences }: MatchmakingRequest = await req.json();

    switch (action) {
      case 'join':
        return await handleJoinGame(supabaseClient, user.id, invite_code, preferences);
      
      case 'create_private':
        return await handleCreatePrivateGame(supabaseClient, user.id);
      
      case 'leave':
        return await handleLeaveGame(supabaseClient, user.id);
      
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

async function handleJoinGame(supabaseClient: any, userId: string, inviteCode?: string, preferences?: any) {
  // Check if user is already in an active game
  const { data: existingParticipation } = await supabaseClient
    .from('blinddate_participants')
    .select(`
      session_id,
      blinddate_sessions(status)
    `)
    .eq('user_id', userId)
    .in('blinddate_sessions.status', ['waiting', 'active']);

  if (existingParticipation && existingParticipation.length > 0) {
    return new Response(
      JSON.stringify({ 
        error: 'Already in an active game',
        session_id: existingParticipation[0].session_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }

  let session: GameSession;

  if (inviteCode) {
    // Join private game with invite code
    const { data: privateSession, error } = await supabaseClient
      .from('blinddate_sessions')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('status', 'waiting')
      .single();

    if (error || !privateSession) {
      throw new Error('Invalid invite code or session not found');
    }

    session = privateSession;
  } else {
    // Quick match - find or create public game
    const { data: waitingSessions } = await supabaseClient
      .from('blinddate_sessions')
      .select(`
        *,
        blinddate_participants(count)
      `)
      .eq('status', 'waiting')
      .eq('is_private', false)
      .lt('blinddate_participants.count', 2);

    if (waitingSessions && waitingSessions.length > 0) {
      // Join existing waiting session
      session = waitingSessions[0];
    } else {
      // No matches found - create new session and enter waiting mode
      const { data: newSession, error } = await supabaseClient
        .from('blinddate_sessions')
        .insert({
          status: 'waiting',
          is_private: false
        })
        .select()
        .single();

      if (error) throw error;
      session = newSession;
    }
  }

  // Determine role (A or B)
  const { data: existingParticipants } = await supabaseClient
    .from('blinddate_participants')
    .select('role')
    .eq('session_id', session.id);

  const role = existingParticipants?.find(p => p.role === 'A') ? 'B' : 'A';

  // Generate fun avatar name
  const avatarNames = [
    'Purple Butterfly', 'Golden Star', 'Silver Moon', 'Pink Rose',
    'Blue Ocean', 'Green Forest', 'Red Phoenix', 'Orange Sunset'
  ];
  const avatarName = avatarNames[Math.floor(Math.random() * avatarNames.length)];

  // Add user to session
  const { error: joinError } = await supabaseClient
    .from('blinddate_participants')
    .insert({
      session_id: session.id,
      user_id: userId,
      role,
      avatar_name: avatarName
    });

  if (joinError) throw joinError;

  // Check if session is now full (2 participants)
  const { data: allParticipants } = await supabaseClient
    .from('blinddate_participants')
    .select('*')
    .eq('session_id', session.id);

  if (allParticipants && allParticipants.length === 2) {
    // Start the game
    const { error: updateError } = await supabaseClient
      .from('blinddate_sessions')
      .update({ status: 'active' })
      .eq('id', session.id);

    if (updateError) throw updateError;

    // Create game rounds
    await supabaseClient.rpc('create_session_rounds', { session_id: session.id });
  }

  return new Response(
    JSON.stringify({
      session_id: session.id,
      role,
      avatar_name: avatarName,
      status: allParticipants?.length === 2 ? 'active' : 'waiting',
      participant_count: allParticipants?.length || 1,
      is_new_session: !waitingSessions || waitingSessions.length === 0,
      match_type: inviteCode ? 'private' : (waitingSessions && waitingSessions.length > 0 ? 'found_match' : 'no_match_waiting')
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCreatePrivateGame(supabaseClient: any, userId: string) {
  // Generate unique invite code
  let inviteCode: string;
  let attempts = 0;
  
  do {
    inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    attempts++;
    
    const { data: existingSession } = await supabaseClient
      .from('blinddate_sessions')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (!existingSession) break;
  } while (attempts < 10);

  // Create private session
  const { data: session, error } = await supabaseClient
    .from('blinddate_sessions')
    .insert({
      status: 'waiting',
      is_private: true,
      invite_code: inviteCode
    })
    .select()
    .single();

  if (error) throw error;

  // Add creator as first participant
  const avatarName = 'Mystery Host';
  
  const { error: joinError } = await supabaseClient
    .from('blinddate_participants')
    .insert({
      session_id: session.id,
      user_id: userId,
      role: 'A',
      avatar_name: avatarName
    });

  if (joinError) throw joinError;

  return new Response(
    JSON.stringify({
      session_id: session.id,
      invite_code: inviteCode,
      role: 'A',
      avatar_name: avatarName,
      status: 'waiting'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleLeaveGame(supabaseClient: any, userId: string) {
  // Find user's active session
  const { data: participation, error: findError } = await supabaseClient
    .from('blinddate_participants')
    .select(`
      session_id,
      blinddate_sessions(status)
    `)
    .eq('user_id', userId)
    .in('blinddate_sessions.status', ['waiting', 'active'])
    .single();

  if (findError || !participation) {
    return new Response(
      JSON.stringify({ message: 'No active session found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const sessionId = participation.session_id;

  // Remove participant
  const { error: removeError } = await supabaseClient
    .from('blinddate_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (removeError) throw removeError;

  // Check remaining participants
  const { data: remainingParticipants } = await supabaseClient
    .from('blinddate_participants')
    .select('*')
    .eq('session_id', sessionId);

  if (!remainingParticipants || remainingParticipants.length === 0) {
    // No participants left, end session
    await supabaseClient
      .from('blinddate_sessions')
      .update({ 
        status: 'finished',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  } else if (remainingParticipants.length === 1) {
    // One participant left, return to waiting
    await supabaseClient
      .from('blinddate_sessions')
      .update({ status: 'waiting' })
      .eq('id', sessionId);
  }

  return new Response(
    JSON.stringify({ message: 'Successfully left the game' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/* To deploy this function run:
 * npx supabase functions deploy blinddate-matchmaking --no-verify-jwt
 */