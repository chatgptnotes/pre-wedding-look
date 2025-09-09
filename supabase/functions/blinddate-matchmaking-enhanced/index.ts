import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bot demo user ID (system bot)
const SYSTEM_BOT_USER_ID = '00000000-0000-0000-0000-000000000000';
const WAITING_TIMEOUT_SECONDS = 45;

// Retry utility function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting ${operationName} (attempt ${attempt}/${maxRetries})`);
      const result = await operation();
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      console.error(`❌ ${operationName} failed on attempt ${attempt}:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`💥 ${operationName} failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Max retries exceeded for ${operationName}`);
}

interface MatchmakeRequest {
  action?: string;
  prefs?: any;
  isPrivate?: boolean;
  inviteCode?: string;
  requestBotDemo?: boolean;
  user_id?: string;
  user_email?: string;
}

type MatchmakeResponse = 
  | { sessionId: string; role: 'A'|'B'; status: 'waiting'|'active'; inviteCode?: string; botOffered?: boolean; queueETA?: number }
  | { sessionId: string; role: 'A'; status: 'active'; botDemo: true };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, prefs, isPrivate, inviteCode, requestBotDemo, user_id, user_email }: MatchmakeRequest = await req.json();

    console.log('Request received:', { action, user_id, user_email });

    let user = null;
    
    // Try to get user from auth header first
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      console.log('Attempting auth with header...');
      try {
        const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (!userError && authUser) {
          user = authUser;
          console.log('✅ Auth successful via header:', user.id);
        }
      } catch (error) {
        console.log('Auth header failed:', error.message);
      }
    }
    
    // If auth header failed, but we have user info in body, create a mock user object
    if (!user && user_id) {
      console.log('Using user info from request body');
      user = {
        id: user_id,
        email: user_email || `user-${user_id}@example.com`,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('✅ Using user from body:', user.id);
    }
    
    if (!user) {
      throw new Error('No valid user authentication found');
    }

    console.log('Matchmaking request:', { action, isPrivate, inviteCode, requestBotDemo });

    // Handle bot demo request
    if (requestBotDemo) {
      return await handleBotDemo(supabaseClient, user.id);
    }

    // Handle private invite code
    if (inviteCode) {
      return await handleInviteCode(supabaseClient, user.id, inviteCode);
    }

    // Handle create private action specifically
    if (action === 'create_private') {
      console.log('Creating private room for user:', user.id);
      return await createWaitingSession(supabaseClient, user.id, true);
    }

    // Handle join action
    if (action === 'join') {
      return await handleMatchmaking(supabaseClient, user.id, isPrivate || false, prefs);
    }

    // Default fallback to matchmaking
    return await handleMatchmaking(supabaseClient, user.id, isPrivate || false, prefs);

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

async function handleInviteCode(supabaseClient: any, userId: string, inviteCode: string) {
  // Try to join existing session with invite code using retry logic
  const existingSession = await retryWithBackoff(async () => {
    const { data: existingSession, error } = await supabaseClient
      .from('blinddate_sessions')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('status', 'waiting')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No session found with this invite code
        console.log('No session found with invite code:', inviteCode);
        return null;
      }
      throw error;
    }

    return existingSession;
  }, 3, 1000, 'invite code lookup');

  if (!existingSession) {
    // Invalid code - create new waiting session and return new invite
    console.log('Creating new session for invalid invite code');
    return await createWaitingSession(supabaseClient, userId, true);
  }

  // Join as Player B
  console.log('Joining existing session:', existingSession.id);
  return await joinSession(supabaseClient, userId, existingSession.id, 'B');
}

async function handleMatchmaking(supabaseClient: any, userId: string, isPrivate: boolean, prefs?: any) {
  // Check for existing waiting sessions (only for public matches)
  if (!isPrivate) {
    const waitingSession = await retryWithBackoff(async () => {
      // Optimized query - get just the first available session with participant count
      const { data: sessions, error } = await supabaseClient
        .from('blinddate_sessions')
        .select(`
          id,
          created_at,
          blinddate_participants!inner(session_id)
        `)
        .eq('status', 'waiting')
        .eq('is_private', false)
        .order('created_at', { ascending: true })
        .limit(5); // Limit to reduce data transfer

      if (error) {
        throw error;
      }

      // Find the first session with exactly 1 participant (waiting for Player B)
      const availableSession = sessions?.find(session => 
        session.blinddate_participants.length === 1
      );

      return availableSession;
    }, 3, 1000, 'available session lookup');

    if (waitingSession) {
      // Join existing session as Player B
      console.log('Found available public session:', waitingSession.id);
      return await joinSession(supabaseClient, userId, waitingSession.id, 'B');
    }
    
    console.log('No available public sessions found, creating new session');
  }

  // No matches found - create waiting session
  return await createWaitingSession(supabaseClient, userId, isPrivate);
}

async function createWaitingSession(supabaseClient: any, userId: string, isPrivate: boolean) {
  console.log('Creating waiting session for user:', userId);
  
  // Generate invite code
  const inviteCode = generateInviteCode();
  console.log('Generated invite code:', inviteCode);
  
  // Create session with retry logic
  const session = await retryWithBackoff(async () => {
    console.log('Attempting to create session in database...');
    const { data: session, error: sessionError } = await supabaseClient
      .from('blinddate_sessions')
      .insert({
        status: 'waiting',
        is_private: isPrivate,
        invite_code: inviteCode
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation failed:', sessionError);
      throw sessionError;
    }
    
    console.log('Session created successfully:', session.id);
    return session;
  }, 3, 1000, 'session creation');

  // Add user as Player A with retry logic
  const avatarName = generateAvatarName();
  await retryWithBackoff(async () => {
    console.log('Adding participant to session:', { sessionId: session.id, userId, avatarName });
    
    const { error: participantError } = await supabaseClient
      .from('blinddate_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        role: 'A',
        avatar_name: avatarName
      });

    if (participantError) {
      console.error('Participant creation failed:', participantError);
      throw participantError;
    }
    
    console.log('Participant added successfully');
  }, 3, 1000, 'participant creation');

  // Schedule timeout handler
  scheduleWaitingTimeout(supabaseClient, session.id, userId);

  // Calculate queue ETA
  const queueETA = await calculateQueueETA(supabaseClient);

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      role: 'A',
      status: 'waiting',
      inviteCode: inviteCode,
      queueETA: queueETA,
      avatarName: avatarName,
      waitingTimeout: WAITING_TIMEOUT_SECONDS
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function joinSession(supabaseClient: any, userId: string, sessionId: string, role: 'A' | 'B') {
  const avatarName = generateAvatarName();
  console.log(`Joining session ${sessionId} as role ${role} with avatar ${avatarName}`);
  
  // Add user as participant with retry logic
  await retryWithBackoff(async () => {
    const { error: participantError } = await supabaseClient
      .from('blinddate_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: role,
        avatar_name: avatarName
      });

    if (participantError) {
      console.error('Failed to add participant:', participantError);
      throw participantError;
    }
    
    console.log('Participant added successfully');
  }, 3, 1000, 'participant join');

  // Update session to active with retry logic
  await retryWithBackoff(async () => {
    const { error: updateError } = await supabaseClient
      .from('blinddate_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to activate session:', updateError);
      throw updateError;
    }
    
    console.log('Session activated successfully');
  }, 3, 1000, 'session activation');

  // Create rounds with retry logic
  await retryWithBackoff(async () => {
    await createGameRounds(supabaseClient, sessionId);
  }, 2, 1500, 'game rounds creation');

  // Broadcast events (best effort - don't retry on failure)
  try {
    await broadcastEvent(supabaseClient, sessionId, 'participant_joined', { role, userId });
    await broadcastEvent(supabaseClient, sessionId, 'status_changed', { status: 'active' });
  } catch (broadcastError) {
    console.warn('Broadcasting failed (non-critical):', broadcastError.message);
  }

  return new Response(
    JSON.stringify({
      sessionId: sessionId,
      role: role,
      status: 'active',
      avatarName: avatarName,
      matchType: 'found_match'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleBotDemo(supabaseClient: any, userId: string) {
  // Create new session with bot
  const { data: session, error: sessionError } = await supabaseClient
    .from('blinddate_sessions')
    .insert({
      status: 'active',
      is_private: false
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // Add user as Player A
  const userAvatarName = generateAvatarName();
  const { error: userParticipantError } = await supabaseClient
    .from('blinddate_participants')
    .insert({
      session_id: session.id,
      user_id: userId,
      role: 'A',
      avatar_name: userAvatarName
    });

  if (userParticipantError) throw userParticipantError;

  // Add bot as Player B
  const botAvatarName = 'AI Style Buddy';
  const { error: botParticipantError } = await supabaseClient
    .from('blinddate_participants')
    .insert({
      session_id: session.id,
      user_id: SYSTEM_BOT_USER_ID,
      role: 'B',
      avatar_name: botAvatarName
    });

  if (botParticipantError) throw botParticipantError;

  // Create rounds
  await createGameRounds(supabaseClient, session.id);

  // Broadcast bot attachment
  await broadcastEvent(supabaseClient, session.id, 'bot_attached', { 
    botName: botAvatarName,
    message: 'AI Style Buddy has joined to play with you!'
  });

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      role: 'A',
      status: 'active',
      botDemo: true,
      avatarName: userAvatarName,
      botAvatarName: botAvatarName
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function scheduleWaitingTimeout(supabaseClient: any, sessionId: string, userId: string) {
  // In a real implementation, this would use a queue/scheduler
  // For now, we'll use a simple setTimeout (not production-ready)
  setTimeout(async () => {
    try {
      // Check if session is still waiting
      const { data: session } = await supabaseClient
        .from('blinddate_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (session && session.status === 'waiting') {
        // Broadcast timeout event to frontend
        await broadcastEvent(supabaseClient, sessionId, 'waiting_timeout', {
          message: "No matches found. Would you like to play with an AI buddy or invite a friend?",
          options: ['bot_demo', 'share_invite', 'try_again']
        });
      }
    } catch (error) {
      console.error('Timeout handler error:', error);
    }
  }, WAITING_TIMEOUT_SECONDS * 1000);
}

async function createGameRounds(supabaseClient: any, sessionId: string) {
  const now = new Date();
  
  const rounds = [
    {
      session_id: sessionId,
      round_no: 1,
      topic: 'attire',
      time_limit_seconds: 180,
      started_at: new Date(now.getTime() + 5000).toISOString(), // Start in 5 seconds
    },
    {
      session_id: sessionId,
      round_no: 2,
      topic: 'hair',
      time_limit_seconds: 180,
      started_at: new Date(now.getTime() + 185000).toISOString(), // Start after round 1
    },
    {
      session_id: sessionId,
      round_no: 3,
      topic: 'location',
      time_limit_seconds: 120,
      started_at: new Date(now.getTime() + 365000).toISOString(), // Start after round 2
    }
  ];

  const { error } = await supabaseClient
    .from('blinddate_rounds')
    .insert(rounds);

  if (error) throw error;

  // Broadcast first round start
  await broadcastEvent(supabaseClient, sessionId, 'round_started', {
    round_no: 1,
    topic: 'attire',
    ends_at: new Date(now.getTime() + 185000).toISOString()
  });
}

async function calculateQueueETA(supabaseClient: any) {
  // Get recent match times for ETA calculation
  const { data: recentMatches } = await supabaseClient
    .from('blinddate_sessions')
    .select('created_at')
    .eq('status', 'active')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('created_at', { ascending: false })
    .limit(50);

  if (!recentMatches || recentMatches.length < 10) {
    return 30; // Default 30 seconds if not enough data
  }

  // Calculate median time (simplified)
  return Math.min(Math.max(15, recentMatches.length * 2), 60);
}

async function broadcastEvent(supabaseClient: any, sessionId: string, event: string, payload: any) {
  try {
    const { error } = await supabaseClient
      .channel(`blinddate:session:${sessionId}`)
      .send({
        type: 'broadcast',
        event: event,
        payload: payload
      });

    if (error) console.error('Broadcast error:', error);
  } catch (error) {
    console.error('Broadcast exception:', error);
  }
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateAvatarName(): string {
  const adjectives = ['Purple', 'Golden', 'Silver', 'Pink', 'Blue', 'Green', 'Red', 'Orange', 'Cosmic', 'Mystic'];
  const nouns = ['Butterfly', 'Star', 'Moon', 'Rose', 'Ocean', 'Forest', 'Phoenix', 'Sunset', 'Dragon', 'Unicorn'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective} ${noun}`;
}

/* To deploy this function run:
 * npx supabase functions deploy blinddate-matchmaking-enhanced --no-verify-jwt
 */