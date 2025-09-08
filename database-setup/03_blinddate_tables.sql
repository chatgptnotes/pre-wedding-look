-- BLIND DATE MINI GAME TABLES
-- ===================================

-- Main game sessions table
CREATE TABLE IF NOT EXISTS public.blinddate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('waiting','active','reveal','finished')) DEFAULT 'waiting',
  is_private BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Players in each game session
CREATE TABLE IF NOT EXISTS public.blinddate_participants (
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('A','B')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_revealed BOOLEAN DEFAULT false,
  avatar_name TEXT DEFAULT 'Mystery Person',
  PRIMARY KEY (session_id, user_id)
);

-- Game rounds (Attire, Hair & Accessories, Location & Vibe)
CREATE TABLE IF NOT EXISTS public.blinddate_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  round_no INTEGER CHECK (round_no BETWEEN 1 AND 3),
  topic TEXT CHECK (topic IN ('attire', 'hair', 'location')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  time_limit_seconds INTEGER DEFAULT 180
);

-- The styling designs created by each player
CREATE TABLE IF NOT EXISTS public.blinddate_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  round_id UUID REFERENCES public.blinddate_rounds ON DELETE CASCADE,
  designer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT CHECK (target_role IN ('A','B')),
  prompt JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions and votes after the big reveal
CREATE TABLE IF NOT EXISTS public.blinddate_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  voter_user_id UUID REFERENCES public.profiles(id),
  vote TEXT CHECK (vote IN ('A', 'B', 'tie')),
  reaction TEXT CHECK (reaction IN ('heart','fire','laugh','surprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generated share content (for social media)
CREATE TABLE IF NOT EXISTS public.blinddate_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  video_url TEXT,
  caption TEXT,
  watermark_position JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blinddate_sessions_status ON public.blinddate_sessions(status);
CREATE INDEX IF NOT EXISTS idx_blinddate_sessions_invite_code ON public.blinddate_sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_blinddate_participants_session ON public.blinddate_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_rounds_session ON public.blinddate_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_designs_session ON public.blinddate_designs(session_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_designs_round ON public.blinddate_designs(round_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_shares_expires ON public.blinddate_shares(expires_at);

-- Security policies (RLS)
ALTER TABLE public.blinddate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_shares ENABLE ROW LEVEL SECURITY;

-- Players can see sessions they're part of
CREATE POLICY "Players can view their sessions" ON public.blinddate_sessions
  FOR SELECT USING (
    id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can join sessions
CREATE POLICY "Players can join sessions" ON public.blinddate_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Players can view other participants in their sessions
CREATE POLICY "Players can view session participants" ON public.blinddate_participants
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can view rounds in their sessions
CREATE POLICY "Players can view session rounds" ON public.blinddate_rounds
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can create designs in their sessions
CREATE POLICY "Players can create designs" ON public.blinddate_designs
  FOR INSERT WITH CHECK (
    designer_user_id = auth.uid() AND
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can view designs in their sessions (after reveal)
CREATE POLICY "Players can view revealed designs" ON public.blinddate_designs
  FOR SELECT USING (
    session_id IN (
      SELECT bp.session_id FROM public.blinddate_participants bp
      JOIN public.blinddate_sessions bs ON bp.session_id = bs.id
      WHERE bp.user_id = auth.uid() AND bs.status IN ('reveal', 'finished')
    )
  );

-- Players can give feedback
CREATE POLICY "Players can give feedback" ON public.blinddate_feedback
  FOR INSERT WITH CHECK (
    voter_user_id = auth.uid() AND
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can view share content for their sessions
CREATE POLICY "Players can view share content" ON public.blinddate_shares
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- ===================================
-- BLIND DATE HELPER FUNCTIONS
-- ===================================

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code() RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create rounds when session starts
CREATE OR REPLACE FUNCTION public.create_session_rounds(session_id UUID) RETURNS VOID AS $$
BEGIN
  -- Round 1: Attire (3 minutes)
  INSERT INTO public.blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  VALUES (session_id, 1, 'attire', 180);
  
  -- Round 2: Hair & Accessories (3 minutes)
  INSERT INTO public.blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  VALUES (session_id, 2, 'hair', 180);
  
  -- Round 3: Location & Vibe (2 minutes)
  INSERT INTO public.blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  VALUES (session_id, 3, 'location', 120);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired shares (run this with a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares() RETURNS VOID AS $$
BEGIN
  DELETE FROM public.blinddate_shares WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================
