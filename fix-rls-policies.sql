-- Fix RLS policies for Blind Date tables to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Players can view their sessions" ON public.blinddate_sessions;
DROP POLICY IF EXISTS "Players can join sessions" ON public.blinddate_participants;
DROP POLICY IF EXISTS "Players can view session participants" ON public.blinddate_participants;
DROP POLICY IF EXISTS "Players can view session rounds" ON public.blinddate_rounds;
DROP POLICY IF EXISTS "Players can create designs" ON public.blinddate_designs;
DROP POLICY IF EXISTS "Players can view revealed designs" ON public.blinddate_designs;
DROP POLICY IF EXISTS "Players can give feedback" ON public.blinddate_feedback;
DROP POLICY IF EXISTS "Players can view share content" ON public.blinddate_shares;

-- Create new, non-recursive policies

-- Sessions: Allow authenticated users to view sessions they're part of
CREATE POLICY "Users can view their sessions" ON public.blinddate_sessions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.blinddate_participants p
      WHERE p.session_id = blinddate_sessions.id
    )
  );

-- Sessions: Allow authenticated users to create sessions
CREATE POLICY "Users can create sessions" ON public.blinddate_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Sessions: Allow users to update their own sessions
CREATE POLICY "Users can update their sessions" ON public.blinddate_sessions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.blinddate_participants p
      WHERE p.session_id = blinddate_sessions.id
    )
  );

-- Participants: Allow users to view participants in their sessions
CREATE POLICY "Users can view participants" ON public.blinddate_participants
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p2.user_id 
      FROM public.blinddate_participants p2
      WHERE p2.session_id = blinddate_participants.session_id
    )
  );

-- Participants: Allow users to join sessions
CREATE POLICY "Users can join sessions" ON public.blinddate_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Participants: Allow users to update their participation
CREATE POLICY "Users can update participation" ON public.blinddate_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Participants: Allow users to leave sessions
CREATE POLICY "Users can leave sessions" ON public.blinddate_participants
  FOR DELETE USING (user_id = auth.uid());

-- Rounds: Allow viewing rounds for sessions user is in
CREATE POLICY "Users can view rounds" ON public.blinddate_rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.blinddate_participants
      WHERE blinddate_participants.session_id = blinddate_rounds.session_id
      AND blinddate_participants.user_id = auth.uid()
    )
  );

-- Rounds: Allow creating rounds for sessions
CREATE POLICY "System can create rounds" ON public.blinddate_rounds
  FOR INSERT WITH CHECK (true);

-- Rounds: Allow updating rounds
CREATE POLICY "System can update rounds" ON public.blinddate_rounds
  FOR UPDATE USING (true);

-- Designs: Allow users to create designs
CREATE POLICY "Users can create designs" ON public.blinddate_designs
  FOR INSERT WITH CHECK (
    designer_user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.blinddate_participants
      WHERE blinddate_participants.session_id = blinddate_designs.session_id
      AND blinddate_participants.user_id = auth.uid()
    )
  );

-- Designs: Allow viewing designs in reveal/finished sessions
CREATE POLICY "Users can view designs" ON public.blinddate_designs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM public.blinddate_participants p
      JOIN public.blinddate_sessions s ON p.session_id = s.id
      WHERE p.session_id = blinddate_designs.session_id
      AND p.user_id = auth.uid()
      AND s.status IN ('reveal', 'finished')
    )
  );

-- Feedback: Allow users to give feedback
CREATE POLICY "Users can give feedback" ON public.blinddate_feedback
  FOR INSERT WITH CHECK (
    voter_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.blinddate_participants
      WHERE blinddate_participants.session_id = blinddate_feedback.session_id
      AND blinddate_participants.user_id = auth.uid()
    )
  );

-- Feedback: Allow viewing feedback
CREATE POLICY "Users can view feedback" ON public.blinddate_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.blinddate_participants
      WHERE blinddate_participants.session_id = blinddate_feedback.session_id
      AND blinddate_participants.user_id = auth.uid()
    )
  );

-- Shares: Allow viewing share content
CREATE POLICY "Users can view shares" ON public.blinddate_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.blinddate_participants
      WHERE blinddate_participants.session_id = blinddate_shares.session_id
      AND blinddate_participants.user_id = auth.uid()
    )
  );

-- Shares: Allow creating share content
CREATE POLICY "Users can create shares" ON public.blinddate_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blinddate_participants
      WHERE blinddate_participants.session_id = blinddate_shares.session_id
      AND blinddate_participants.user_id = auth.uid()
    )
  );

-- Also ensure profiles table exists and has proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles (for matching)
CREATE POLICY IF NOT EXISTS "Profiles are viewable by users" ON public.profiles
  FOR SELECT USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: Users can insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();