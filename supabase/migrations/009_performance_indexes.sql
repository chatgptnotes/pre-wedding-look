-- ============================================
-- PERFORMANCE INDEXES FOR BLIND DATE GAME
-- ============================================
-- Optimized indexes to eliminate slow full-table scans

-- ============================================
-- SESSIONS TABLE INDEXES
-- ============================================

-- Index for finding active sessions by status
CREATE INDEX IF NOT EXISTS idx_sessions_status 
ON blinddate_sessions(status) 
WHERE status IN ('waiting', 'active', 'styling');

-- Index for finding sessions by invite code (for joining)
CREATE INDEX IF NOT EXISTS idx_sessions_invite_code 
ON blinddate_sessions(invite_code) 
WHERE invite_code IS NOT NULL;

-- Index for matchmaking queue (composite index)
CREATE INDEX IF NOT EXISTS idx_sessions_matchmaking 
ON blinddate_sessions(status, created_at) 
WHERE status = 'matchmaking';

-- Index for finding user's recent sessions
CREATE INDEX IF NOT EXISTS idx_sessions_created_by_date 
ON blinddate_sessions(created_by, created_at DESC);

-- ============================================
-- PARTICIPANTS TABLE INDEXES
-- ============================================

-- Index for finding participants by user
CREATE INDEX IF NOT EXISTS idx_participants_user 
ON blinddate_participants(user_id);

-- Index for finding participants in a session
CREATE INDEX IF NOT EXISTS idx_participants_session 
ON blinddate_participants(session_id);

-- Composite index for checking if user is in session
CREATE INDEX IF NOT EXISTS idx_participants_user_session 
ON blinddate_participants(user_id, session_id);

-- Index for ready status checks
CREATE INDEX IF NOT EXISTS idx_participants_ready 
ON blinddate_participants(session_id, is_ready) 
WHERE is_ready = true;

-- ============================================
-- ROUND DESIGNS TABLE INDEXES
-- ============================================

-- Index for finding designs by participant and round
CREATE INDEX IF NOT EXISTS idx_designs_participant_round 
ON blinddate_round_designs(participant_id, round_number);

-- Index for finding all designs in a round for a session
CREATE INDEX IF NOT EXISTS idx_designs_session_round 
ON blinddate_round_designs(
    participant_id,
    round_number,
    created_at
);

-- Index for submitted designs
CREATE INDEX IF NOT EXISTS idx_designs_submitted 
ON blinddate_round_designs(participant_id, round_number, submitted_at) 
WHERE submitted_at IS NOT NULL;

-- ============================================
-- FEEDBACK TABLE INDEXES
-- ============================================

-- Index for finding feedback by sender
CREATE INDEX IF NOT EXISTS idx_feedback_from 
ON blinddate_feedback(from_participant_id);

-- Index for finding feedback by receiver
CREATE INDEX IF NOT EXISTS idx_feedback_to 
ON blinddate_feedback(to_participant_id);

-- Composite index for vote aggregation
CREATE INDEX IF NOT EXISTS idx_feedback_votes 
ON blinddate_feedback(to_participant_id, round_number, vote_type);

-- Index for finding feedback in a specific round
CREATE INDEX IF NOT EXISTS idx_feedback_round 
ON blinddate_feedback(round_number, created_at DESC);

-- ============================================
-- GENERATION QUEUE INDEXES (Preparation)
-- ============================================

-- Create generation queue table for async processing
CREATE TABLE IF NOT EXISTS generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id UUID REFERENCES blinddate_sessions(id),
    design_id UUID REFERENCES blinddate_round_designs(id),
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    priority INT DEFAULT 0,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    result_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_queue_status_priority 
ON generation_queue(status, priority DESC, created_at) 
WHERE status IN ('pending', 'retry');

CREATE INDEX IF NOT EXISTS idx_queue_user 
ON generation_queue(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_session 
ON generation_queue(session_id);

CREATE INDEX IF NOT EXISTS idx_queue_design 
ON generation_queue(design_id);

-- Index for retry processing
CREATE INDEX IF NOT EXISTS idx_queue_retry 
ON generation_queue(next_retry_at) 
WHERE status = 'retry' AND next_retry_at IS NOT NULL;

-- ============================================
-- LEADERBOARD & STATS INDEXES
-- ============================================

-- Create materialized view for leaderboard caching
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_cache AS
SELECT 
    u.id as user_id,
    u.raw_user_meta_data->>'display_name' as display_name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    COUNT(DISTINCT s.id) as total_games,
    COUNT(DISTINCT CASE WHEN p.is_winner THEN s.id END) as wins,
    ROUND(AVG(f.rating), 2) as avg_rating,
    SUM(CASE WHEN f.vote_type = 'best_overall' THEN 1 ELSE 0 END) as best_overall_votes,
    SUM(CASE WHEN f.vote_type = 'most_creative' THEN 1 ELSE 0 END) as creative_votes,
    SUM(CASE WHEN f.vote_type = 'most_romantic' THEN 1 ELSE 0 END) as romantic_votes,
    MAX(p.updated_at) as last_played
FROM auth.users u
LEFT JOIN blinddate_participants p ON p.user_id = u.id
LEFT JOIN blinddate_sessions s ON s.id = p.session_id AND s.status = 'completed'
LEFT JOIN blinddate_feedback f ON f.to_participant_id = p.id
GROUP BY u.id, u.raw_user_meta_data;

-- Index for fast leaderboard queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user 
ON leaderboard_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_wins 
ON leaderboard_cache(wins DESC, avg_rating DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rating 
ON leaderboard_cache(avg_rating DESC NULLS LAST);

-- ============================================
-- TOURNAMENT SUPPORT INDEXES
-- ============================================

-- Tournament table for future feature
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_participants INT DEFAULT 100,
    current_participants INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status 
ON tournaments(status, start_time);

CREATE INDEX IF NOT EXISTS idx_tournaments_active 
ON tournaments(start_time, end_time) 
WHERE status = 'active';

-- ============================================
-- CLEANUP & MAINTENANCE INDEXES
-- ============================================

-- Index for finding old incomplete sessions to clean up
CREATE INDEX IF NOT EXISTS idx_sessions_cleanup 
ON blinddate_sessions(created_at) 
WHERE status NOT IN ('completed', 'cancelled');

-- Index for finding orphaned designs (no session)
CREATE INDEX IF NOT EXISTS idx_designs_orphaned 
ON blinddate_round_designs(created_at) 
WHERE NOT EXISTS (
    SELECT 1 FROM blinddate_participants p 
    WHERE p.id = participant_id
);

-- ============================================
-- FUNCTION TO ANALYZE QUERY PERFORMANCE
-- ============================================

CREATE OR REPLACE FUNCTION analyze_slow_queries()
RETURNS TABLE(
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    max_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        substring(query, 1, 100) as query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        max_exec_time as max_time
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VACUUM ANALYZE HELPERS
-- ============================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON leaderboard_cache TO authenticated;
GRANT SELECT ON generation_queue TO authenticated;
GRANT INSERT ON generation_queue TO authenticated;
GRANT SELECT ON tournaments TO authenticated;

GRANT EXECUTE ON FUNCTION analyze_slow_queries() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_leaderboard() TO authenticated;