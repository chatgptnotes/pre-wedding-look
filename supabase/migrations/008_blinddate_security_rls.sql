-- ============================================
-- BLIND DATE SECURITY & RLS POLICIES
-- ============================================
-- This migration implements comprehensive Row Level Security
-- to ensure players can only see appropriate data at the right time

-- Enable RLS on all blind date tables
ALTER TABLE blinddate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinddate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinddate_round_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinddate_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SESSIONS TABLE POLICIES
-- ============================================

-- Policy: Users can view sessions they are participating in
CREATE POLICY "Users can view their sessions"
    ON blinddate_sessions
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM blinddate_participants 
            WHERE session_id = blinddate_sessions.id
        )
    );

-- Policy: Users can create new sessions
CREATE POLICY "Users can create sessions"
    ON blinddate_sessions
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Policy: Only session creator can update session
CREATE POLICY "Session creator can update session"
    ON blinddate_sessions
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- ============================================
-- PARTICIPANTS TABLE POLICIES
-- ============================================

-- Policy: Users can view participants in their sessions
CREATE POLICY "Users can view participants in their sessions"
    ON blinddate_participants
    FOR SELECT
    USING (
        session_id IN (
            SELECT session_id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can join sessions (insert themselves as participants)
CREATE POLICY "Users can join sessions"
    ON blinddate_participants
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own participant record
CREATE POLICY "Users can update own participant record"
    ON blinddate_participants
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- ROUND DESIGNS TABLE POLICIES
-- ============================================

-- Policy: Users can only view their own designs during rounds
CREATE POLICY "Users can view own designs during rounds"
    ON blinddate_round_designs
    FOR SELECT
    USING (
        participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can view partner's designs only after reveal
CREATE POLICY "Users can view partner designs after reveal"
    ON blinddate_round_designs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM blinddate_sessions s
            INNER JOIN blinddate_participants p ON p.session_id = s.id
            WHERE p.user_id = auth.uid()
            AND s.id = (
                SELECT session_id FROM blinddate_participants
                WHERE id = blinddate_round_designs.participant_id
            )
            AND (
                s.status = 'reveal' 
                OR s.status = 'completed'
                OR (s.current_round > blinddate_round_designs.round_number)
            )
        )
    );

-- Policy: Users can create designs for themselves
CREATE POLICY "Users can create own designs"
    ON blinddate_round_designs
    FOR INSERT
    WITH CHECK (
        participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own designs
CREATE POLICY "Users can update own designs"
    ON blinddate_round_designs
    FOR UPDATE
    USING (
        participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- FEEDBACK TABLE POLICIES
-- ============================================

-- Policy: Users can view feedback they gave
CREATE POLICY "Users can view own feedback"
    ON blinddate_feedback
    FOR SELECT
    USING (
        from_participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can view feedback they received after reveal
CREATE POLICY "Users can view received feedback after reveal"
    ON blinddate_feedback
    FOR SELECT
    USING (
        to_participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM blinddate_sessions s
            INNER JOIN blinddate_participants p ON p.session_id = s.id
            WHERE p.id = to_participant_id
            AND (s.status = 'reveal' OR s.status = 'completed')
        )
    );

-- Policy: Users can create feedback
CREATE POLICY "Users can create feedback"
    ON blinddate_feedback
    FOR INSERT
    WITH CHECK (
        from_participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback"
    ON blinddate_feedback
    FOR UPDATE
    USING (
        from_participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        from_participant_id IN (
            SELECT id FROM blinddate_participants
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- HELPER FUNCTIONS FOR COMPLEX RLS
-- ============================================

-- Function to check if user is in a specific session
CREATE OR REPLACE FUNCTION is_user_in_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blinddate_participants
        WHERE session_id = session_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if reveal phase is active for a session
CREATE OR REPLACE FUNCTION is_reveal_phase(session_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    session_status TEXT;
BEGIN
    SELECT status INTO session_status
    FROM blinddate_sessions
    WHERE id = session_uuid;
    
    RETURN session_status IN ('reveal', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner's participant ID in a session
CREATE OR REPLACE FUNCTION get_partner_participant_id(session_uuid UUID)
RETURNS UUID AS $$
DECLARE
    partner_id UUID;
BEGIN
    SELECT id INTO partner_id
    FROM blinddate_participants
    WHERE session_id = session_uuid
    AND user_id != auth.uid()
    LIMIT 1;
    
    RETURN partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADDITIONAL SECURITY CONSTRAINTS
-- ============================================

-- Add check constraint to prevent users from voting for themselves
ALTER TABLE blinddate_feedback
ADD CONSTRAINT no_self_feedback
CHECK (from_participant_id != to_participant_id);

-- Add check constraint to ensure feedback is only for same session
ALTER TABLE blinddate_feedback
ADD CONSTRAINT same_session_feedback
CHECK (
    (SELECT session_id FROM blinddate_participants WHERE id = from_participant_id) =
    (SELECT session_id FROM blinddate_participants WHERE id = to_participant_id)
);

-- Add trigger to prevent design modifications after round completion
CREATE OR REPLACE FUNCTION prevent_design_modification_after_round()
RETURNS TRIGGER AS $$
DECLARE
    current_round_num INT;
    session_status TEXT;
BEGIN
    SELECT s.current_round, s.status 
    INTO current_round_num, session_status
    FROM blinddate_sessions s
    INNER JOIN blinddate_participants p ON p.session_id = s.id
    WHERE p.id = NEW.participant_id;
    
    -- Prevent modification if round has passed or session is in reveal/completed
    IF NEW.round_number < current_round_num OR session_status IN ('reveal', 'completed') THEN
        RAISE EXCEPTION 'Cannot modify designs from completed rounds';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_design_modification
BEFORE UPDATE ON blinddate_round_designs
FOR EACH ROW
EXECUTE FUNCTION prevent_design_modification_after_round();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON blinddate_sessions TO authenticated;
GRANT ALL ON blinddate_participants TO authenticated;
GRANT ALL ON blinddate_round_designs TO authenticated;
GRANT ALL ON blinddate_feedback TO authenticated;

GRANT EXECUTE ON FUNCTION is_user_in_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_reveal_phase(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_participant_id(UUID) TO authenticated;