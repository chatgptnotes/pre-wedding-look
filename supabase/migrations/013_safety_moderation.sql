-- Safety and Moderation Migration
-- This migration adds content moderation, appeals workflow, and fraud prevention

-- Moderation action types
CREATE TYPE moderation_action AS ENUM (
  'flag_content',
  'remove_content', 
  'warn_user',
  'suspend_user',
  'ban_user',
  'shadow_ban',
  'review_required'
);

-- Appeal status types
CREATE TYPE appeal_status AS ENUM (
  'pending',
  'under_review', 
  'approved',
  'denied',
  'escalated'
);

-- Content moderation results
CREATE TABLE content_moderation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL, -- Reference to reel, user upload, etc.
  content_type VARCHAR(50) NOT NULL, -- 'reel', 'profile_image', 'comment'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- AI moderation results
  nsfw_score DECIMAL(5,4) DEFAULT 0, -- 0.0 to 1.0
  toxicity_score DECIMAL(5,4) DEFAULT 0,
  violence_score DECIMAL(5,4) DEFAULT 0,
  adult_content_score DECIMAL(5,4) DEFAULT 0,
  
  -- Moderation decision
  is_flagged BOOLEAN DEFAULT false,
  auto_action moderation_action,
  human_review_required BOOLEAN DEFAULT false,
  
  -- Detection details
  blocked_terms TEXT[], -- Flagged words/phrases
  detected_objects TEXT[], -- AI-detected objects
  confidence_score DECIMAL(5,4) DEFAULT 0,
  
  -- Metadata
  moderation_service VARCHAR(100), -- 'google_vision', 'openai_moderation', etc.
  service_response JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Human moderation queue
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_moderation_id UUID NOT NULL REFERENCES content_moderation_results(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  assigned_moderator_id UUID REFERENCES auth.users(id),
  
  -- Queue metadata
  queue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- SLA tracking
  sla_deadline TIMESTAMP WITH TIME ZONE, -- When this must be completed
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation actions taken
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_moderation_id UUID NOT NULL REFERENCES content_moderation_results(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES auth.users(id), -- NULL for automated actions
  
  action_type moderation_action NOT NULL,
  reason TEXT NOT NULL,
  is_automated BOOLEAN DEFAULT false,
  
  -- Action details
  duration_hours INTEGER, -- For temporary actions like suspensions
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes and evidence
  internal_notes TEXT,
  public_reason TEXT, -- Reason shown to user
  evidence_urls TEXT[], -- Screenshots, logs, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User appeals system
CREATE TABLE user_appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moderation_action_id UUID NOT NULL REFERENCES moderation_actions(id) ON DELETE CASCADE,
  
  -- Appeal details
  appeal_text TEXT NOT NULL,
  user_evidence_urls TEXT[], -- User-provided evidence
  status appeal_status DEFAULT 'pending',
  
  -- Processing
  assigned_reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  resolution_reason TEXT,
  
  -- Timeline
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked terms and phrases for content filtering
CREATE TABLE blocked_content_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term VARCHAR(255) NOT NULL UNIQUE,
  is_regex BOOLEAN DEFAULT false,
  severity INTEGER DEFAULT 1, -- 1=low, 5=high
  category VARCHAR(100), -- 'profanity', 'harassment', 'spam', etc.
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device fingerprinting for fraud detection
CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 of device data
  
  -- Device characteristics
  user_agent TEXT,
  screen_resolution VARCHAR(20),
  timezone VARCHAR(50),
  language VARCHAR(10),
  platform VARCHAR(50),
  
  -- Browser/environment data
  canvas_fingerprint VARCHAR(64),
  webgl_fingerprint VARCHAR(64),
  audio_fingerprint VARCHAR(64),
  
  -- Tracking
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_count INTEGER DEFAULT 0, -- How many users have this fingerprint
  
  -- Risk assessment
  risk_score DECIMAL(3,2) DEFAULT 0, -- 0.0 to 1.0
  is_flagged BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User device associations
CREATE TABLE user_device_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_id UUID NOT NULL REFERENCES device_fingerprints(id) ON DELETE CASCADE,
  
  first_associated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_associated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  association_count INTEGER DEFAULT 1,
  
  is_primary_device BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, fingerprint_id)
);

-- IP address tracking for velocity checks
CREATE TABLE ip_address_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  ip_hash VARCHAR(64) NOT NULL, -- Hashed IP for privacy
  
  -- Geolocation data
  country VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  isp VARCHAR(255),
  
  -- Risk assessment
  is_vpn BOOLEAN DEFAULT false,
  is_tor BOOLEAN DEFAULT false,
  is_datacenter BOOLEAN DEFAULT false,
  risk_score DECIMAL(3,2) DEFAULT 0,
  
  -- Usage tracking
  user_count INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(ip_hash)
);

-- User IP associations
CREATE TABLE user_ip_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_tracking_id UUID NOT NULL REFERENCES ip_address_tracking(id) ON DELETE CASCADE,
  
  first_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, ip_tracking_id)
);

-- Fraud detection events
CREATE TABLE fraud_detection_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'multiple_accounts', 'velocity_limit', 'suspicious_pattern'
  
  -- Event details
  risk_score DECIMAL(3,2) NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  
  -- Detection metadata
  detection_rules TEXT[], -- Which rules triggered
  fingerprint_id UUID REFERENCES device_fingerprints(id),
  ip_tracking_id UUID REFERENCES ip_address_tracking(id),
  
  -- Actions taken
  action_taken VARCHAR(100), -- 'flag', 'soft_ban', 'require_verification'
  auto_resolved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User risk profiles
CREATE TABLE user_risk_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Overall risk assessment
  overall_risk_score DECIMAL(3,2) DEFAULT 0,
  risk_category VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
  
  -- Behavior patterns
  account_age_hours INTEGER DEFAULT 0,
  login_frequency DECIMAL(5,2) DEFAULT 0,
  content_creation_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Flags and restrictions
  is_shadow_banned BOOLEAN DEFAULT false,
  requires_human_review BOOLEAN DEFAULT false,
  max_daily_generations INTEGER DEFAULT 100,
  
  -- Verification status
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  
  -- Last assessments
  last_risk_assessment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_fraud_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Comprehensive audit log
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL, -- 'login', 'content_generation', 'moderation_action'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  fingerprint_id UUID REFERENCES device_fingerprints(id),
  
  -- Risk and flags
  risk_score DECIMAL(3,2) DEFAULT 0,
  flagged BOOLEAN DEFAULT false,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_content_moderation_content ON content_moderation_results(content_id, content_type);
CREATE INDEX idx_content_moderation_user ON content_moderation_results(user_id);
CREATE INDEX idx_content_moderation_flagged ON content_moderation_results(is_flagged, human_review_required);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority DESC, queue_date);
CREATE INDEX idx_moderation_queue_assigned ON moderation_queue(assigned_moderator_id);
CREATE INDEX idx_moderation_queue_sla ON moderation_queue(sla_deadline) WHERE completed_at IS NULL;
CREATE INDEX idx_moderation_actions_content ON moderation_actions(content_moderation_id);
CREATE INDEX idx_user_appeals_status ON user_appeals(status, submitted_at);
CREATE INDEX idx_user_appeals_assigned ON user_appeals(assigned_reviewer_id) WHERE status = 'under_review';
CREATE INDEX idx_blocked_terms_active ON blocked_content_terms(is_active, severity);
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_fingerprints_risk ON device_fingerprints(risk_score DESC, is_flagged);
CREATE INDEX idx_user_device_associations_user ON user_device_associations(user_id);
CREATE INDEX idx_ip_tracking_hash ON ip_address_tracking(ip_hash);
CREATE INDEX idx_ip_tracking_risk ON ip_address_tracking(risk_score DESC);
CREATE INDEX idx_user_ip_associations_user ON user_ip_associations(user_id);
CREATE INDEX idx_fraud_events_user ON fraud_detection_events(user_id);
CREATE INDEX idx_fraud_events_risk ON fraud_detection_events(risk_score DESC);
CREATE INDEX idx_user_risk_profiles_risk ON user_risk_profiles(risk_category, overall_risk_score DESC);
CREATE INDEX idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_event ON security_audit_log(event_type, created_at DESC);
CREATE INDEX idx_security_audit_flagged ON security_audit_log(flagged, processed);

-- RLS Policies

-- Content moderation results - restricted access
ALTER TABLE content_moderation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own moderation results" ON content_moderation_results
  FOR SELECT USING (auth.uid() = user_id);

-- Moderation queue - moderators only
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moderators can access queue" ON moderation_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('moderator', 'admin'))
  );

-- Moderation actions - limited access
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view actions taken on their content" ON moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_moderation_results cmr 
      WHERE cmr.id = content_moderation_id AND cmr.user_id = auth.uid()
    )
  );

-- User appeals - users can see their own appeals
ALTER TABLE user_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own appeals" ON user_appeals
  FOR ALL USING (auth.uid() = user_id);

-- Other tables have restricted access (admin/system only)
ALTER TABLE blocked_content_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access only for blocked terms" ON blocked_content_terms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System access only for fingerprints" ON device_fingerprints
  FOR ALL USING (false); -- System/admin access only

ALTER TABLE user_device_associations ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Users can view their device associations" ON user_device_associations
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE ip_address_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System access only for IP tracking" ON ip_address_tracking
  FOR ALL USING (false); -- System/admin access only

ALTER TABLE user_ip_associations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their IP associations" ON user_ip_associations
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE fraud_detection_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access for fraud events" ON fraud_detection_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE user_risk_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their risk profile summary" ON user_risk_profiles
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access for audit log" ON security_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Functions

-- Function to check content moderation
CREATE OR REPLACE FUNCTION moderate_content(
  content_uuid UUID,
  content_type_val VARCHAR(50),
  user_uuid UUID,
  content_text TEXT DEFAULT NULL,
  image_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  moderation_id UUID;
  blocked_terms_found TEXT[] := '{}';
  risk_score DECIMAL(5,4) := 0;
  requires_review BOOLEAN := false;
  auto_action moderation_action := NULL;
  term_record RECORD;
BEGIN
  -- Check for blocked terms in text content
  IF content_text IS NOT NULL THEN
    FOR term_record IN 
      SELECT term, severity FROM blocked_content_terms 
      WHERE is_active = true
    LOOP
      IF content_text ILIKE '%' || term_record.term || '%' THEN
        blocked_terms_found := array_append(blocked_terms_found, term_record.term);
        risk_score := risk_score + (term_record.severity * 0.1);
      END IF;
    END LOOP;
  END IF;
  
  -- Determine if human review is needed
  requires_review := array_length(blocked_terms_found, 1) > 0 OR risk_score > 0.3;
  
  -- Determine automatic action
  IF risk_score > 0.8 THEN
    auto_action := 'remove_content';
  ELSIF risk_score > 0.5 THEN
    auto_action := 'review_required';
  ELSIF risk_score > 0.3 THEN
    auto_action := 'flag_content';
  END IF;
  
  -- Record moderation result
  INSERT INTO content_moderation_results (
    content_id, content_type, user_id, 
    toxicity_score, is_flagged, auto_action, human_review_required,
    blocked_terms, confidence_score, moderation_service
  ) VALUES (
    content_uuid, content_type_val, user_uuid,
    risk_score, requires_review, auto_action, requires_review,
    blocked_terms_found, risk_score, 'internal_filter'
  )
  RETURNING id INTO moderation_id;
  
  -- Add to moderation queue if review required
  IF requires_review THEN
    INSERT INTO moderation_queue (
      content_moderation_id, 
      priority,
      sla_deadline
    ) VALUES (
      moderation_id,
      CASE WHEN risk_score > 0.7 THEN 1 ELSE 0 END, -- High risk = priority
      NOW() + INTERVAL '24 hours'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'moderation_id', moderation_id,
    'requires_review', requires_review,
    'risk_score', risk_score,
    'blocked_terms', blocked_terms_found,
    'auto_action', auto_action
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record device fingerprint
CREATE OR REPLACE FUNCTION record_device_fingerprint(
  user_uuid UUID,
  fingerprint_data JSONB
)
RETURNS UUID AS $$
DECLARE
  fingerprint_hash VARCHAR(64);
  fingerprint_id UUID;
  existing_users INTEGER;
  risk_score DECIMAL(3,2) := 0;
BEGIN
  -- Generate fingerprint hash
  fingerprint_hash := encode(
    digest(fingerprint_data::text, 'sha256'), 
    'hex'
  );
  
  -- Insert or update fingerprint
  INSERT INTO device_fingerprints (
    fingerprint_hash,
    user_agent,
    screen_resolution, 
    timezone,
    language,
    platform,
    canvas_fingerprint,
    webgl_fingerprint,
    audio_fingerprint,
    last_seen,
    user_count
  ) VALUES (
    fingerprint_hash,
    fingerprint_data->>'userAgent',
    fingerprint_data->>'screenResolution',
    fingerprint_data->>'timezone', 
    fingerprint_data->>'language',
    fingerprint_data->>'platform',
    fingerprint_data->>'canvasFingerprint',
    fingerprint_data->>'webglFingerprint',
    fingerprint_data->>'audioFingerprint',
    NOW(),
    1
  )
  ON CONFLICT (fingerprint_hash) DO UPDATE SET
    last_seen = NOW(),
    user_count = device_fingerprints.user_count + 1
  RETURNING id, user_count INTO fingerprint_id, existing_users;
  
  -- Calculate risk score based on shared device usage
  IF existing_users > 5 THEN
    risk_score := LEAST(1.0, existing_users * 0.1);
    UPDATE device_fingerprints 
    SET risk_score = risk_score, is_flagged = (risk_score > 0.7)
    WHERE id = fingerprint_id;
  END IF;
  
  -- Record user association
  INSERT INTO user_device_associations (
    user_id, fingerprint_id, last_associated, association_count
  ) VALUES (
    user_uuid, fingerprint_id, NOW(), 1
  )
  ON CONFLICT (user_id, fingerprint_id) DO UPDATE SET
    last_associated = NOW(),
    association_count = user_device_associations.association_count + 1;
  
  RETURN fingerprint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assess user risk
CREATE OR REPLACE FUNCTION assess_user_risk(user_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  risk_score DECIMAL(3,2) := 0;
  account_age_hours INTEGER;
  device_count INTEGER;
  ip_count INTEGER;
  fraud_events_count INTEGER;
  content_flags INTEGER;
BEGIN
  -- Get account age in hours
  SELECT EXTRACT(EPOCH FROM (NOW() - created_at))/3600 
  INTO account_age_hours
  FROM auth.users WHERE id = user_uuid;
  
  -- Very new accounts are higher risk
  IF account_age_hours < 24 THEN
    risk_score := risk_score + 0.3;
  ELSIF account_age_hours < 168 THEN -- Less than a week
    risk_score := risk_score + 0.1;
  END IF;
  
  -- Multiple devices/IPs increase risk
  SELECT COUNT(*) INTO device_count FROM user_device_associations WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO ip_count FROM user_ip_associations WHERE user_id = user_uuid;
  
  IF device_count > 3 THEN
    risk_score := risk_score + (device_count - 3) * 0.05;
  END IF;
  
  IF ip_count > 5 THEN
    risk_score := risk_score + (ip_count - 5) * 0.03;
  END IF;
  
  -- Fraud events increase risk significantly
  SELECT COUNT(*) INTO fraud_events_count 
  FROM fraud_detection_events WHERE user_id = user_uuid;
  risk_score := risk_score + fraud_events_count * 0.2;
  
  -- Content moderation flags
  SELECT COUNT(*) INTO content_flags
  FROM content_moderation_results 
  WHERE user_id = user_uuid AND is_flagged = true;
  risk_score := risk_score + content_flags * 0.1;
  
  -- Cap at 1.0
  risk_score := LEAST(1.0, risk_score);
  
  -- Update or create risk profile
  INSERT INTO user_risk_profiles (
    user_id, overall_risk_score, risk_category, account_age_hours, last_risk_assessment
  ) VALUES (
    user_uuid, risk_score, 
    CASE 
      WHEN risk_score > 0.8 THEN 'critical'
      WHEN risk_score > 0.6 THEN 'high'  
      WHEN risk_score > 0.3 THEN 'medium'
      ELSE 'low'
    END,
    account_age_hours, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    overall_risk_score = risk_score,
    risk_category = CASE 
      WHEN risk_score > 0.8 THEN 'critical'
      WHEN risk_score > 0.6 THEN 'high'
      WHEN risk_score > 0.3 THEN 'medium' 
      ELSE 'low'
    END,
    account_age_hours = EXCLUDED.account_age_hours,
    last_risk_assessment = NOW();
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER update_user_appeals_updated_at BEFORE UPDATE ON user_appeals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_content_terms_updated_at BEFORE UPDATE ON blocked_content_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_fingerprints_updated_at BEFORE UPDATE ON device_fingerprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_device_associations_updated_at BEFORE UPDATE ON user_device_associations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_address_tracking_updated_at BEFORE UPDATE ON ip_address_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ip_associations_updated_at BEFORE UPDATE ON user_ip_associations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_risk_profiles_updated_at BEFORE UPDATE ON user_risk_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample blocked terms
INSERT INTO blocked_content_terms (term, severity, category) VALUES
  ('spam', 3, 'spam'),
  ('scam', 4, 'fraud'),
  ('fake', 2, 'misinformation'),
  ('hack', 3, 'security'),
  ('virus', 3, 'security'),
  ('phishing', 5, 'fraud'),
  ('nude', 4, 'nsfw'),
  ('explicit', 3, 'nsfw'),
  ('violence', 4, 'harmful'),
  ('threat', 5, 'harmful');

-- Grant necessary permissions
GRANT SELECT ON content_moderation_results TO authenticated;
GRANT SELECT ON moderation_actions TO authenticated;  
GRANT SELECT, INSERT, UPDATE ON user_appeals TO authenticated;
GRANT SELECT ON user_device_associations TO authenticated;
GRANT SELECT ON user_ip_associations TO authenticated;
GRANT SELECT ON user_risk_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION moderate_content TO authenticated;
GRANT EXECUTE ON FUNCTION record_device_fingerprint TO authenticated;
GRANT EXECUTE ON FUNCTION assess_user_risk TO authenticated;

-- Create initial risk profiles for existing users
INSERT INTO user_risk_profiles (user_id, overall_risk_score, risk_category, account_age_hours)
SELECT 
  id,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/3600 < 24 THEN 0.3
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/3600 < 168 THEN 0.1
    ELSE 0.05
  END,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/3600 < 24 THEN 'medium'
    ELSE 'low'
  END,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;