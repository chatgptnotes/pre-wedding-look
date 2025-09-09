-- Growth Features Migration
-- This migration adds daily challenges, streak tracking, and enhanced referrals

-- Daily challenge themes enum
CREATE TYPE challenge_theme AS ENUM (
  'romantic_sunset',
  'bollywood_glam',
  'vintage_classic',
  'modern_chic',
  'cultural_fusion',
  'destination_wedding',
  'minimalist_elegance'
);

-- Daily challenges table
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_date DATE NOT NULL UNIQUE,
  theme challenge_theme NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  bonus_credits INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User daily challenge participation
CREATE TABLE daily_challenge_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credits_awarded INTEGER DEFAULT 0,
  reel_id UUID, -- Reference to generated reel
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, challenge_id)
);

-- User streak tracking
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_count INTEGER DEFAULT 0, -- Allow 1 day skip per week
  total_challenges_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enhanced referral tiers
CREATE TYPE referral_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Referral tier definitions
CREATE TABLE referral_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier referral_tier NOT NULL UNIQUE,
  min_referrals INTEGER NOT NULL,
  credits_per_referral INTEGER NOT NULL,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
  tier_bonus_credits INTEGER DEFAULT 0,
  perks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User referral stats and vanity slugs
CREATE TABLE user_referral_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vanity_slug VARCHAR(50) UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0, -- Users who actually used the app
  current_tier referral_tier DEFAULT 'bronze',
  tier_progress INTEGER DEFAULT 0,
  lifetime_tier_credits INTEGER DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enhanced user referrals tracking
ALTER TABLE user_referrals ADD COLUMN IF NOT EXISTS tier_at_referral referral_tier DEFAULT 'bronze';
ALTER TABLE user_referrals ADD COLUMN IF NOT EXISTS bonus_multiplier DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_referrals ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false; -- Did referred user actually use the app
ALTER TABLE user_referrals ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE;

-- OG image templates
CREATE TABLE og_image_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  template_type VARCHAR(50) NOT NULL, -- 'tournament', 'reveal', 'challenge'
  svg_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Placeholders like {userName}, {tournamentName}
  dimensions JSONB DEFAULT '{"width": 1200, "height": 630}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User generated OG images cache
CREATE TABLE user_og_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES og_image_templates(id),
  image_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_daily_challenges_active ON daily_challenges(is_active, challenge_date);
CREATE INDEX idx_challenge_participations_user ON daily_challenge_participations(user_id);
CREATE INDEX idx_challenge_participations_challenge ON daily_challenge_participations(challenge_id);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);
CREATE INDEX idx_referral_profiles_vanity ON user_referral_profiles(vanity_slug);
CREATE INDEX idx_referral_profiles_code ON user_referral_profiles(referral_code);
CREATE INDEX idx_referral_profiles_tier ON user_referral_profiles(current_tier);
CREATE INDEX idx_user_referrals_tier ON user_referrals(tier_at_referral);
CREATE INDEX idx_user_referrals_converted ON user_referrals(converted);
CREATE INDEX idx_og_templates_type ON og_image_templates(template_type);
CREATE INDEX idx_user_og_images_user ON user_og_images(user_id);
CREATE INDEX idx_user_og_images_expires ON user_og_images(expires_at);

-- RLS Policies

-- Daily challenges - public read for active challenges
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active daily challenges" ON daily_challenges
  FOR SELECT USING (is_active = true AND challenge_date >= CURRENT_DATE - INTERVAL '1 day');

-- Challenge participations - users can see their own
ALTER TABLE daily_challenge_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own participations" ON daily_challenge_participations
  FOR SELECT USING (auth.uid() = user_id);

-- User streaks - users can see their own
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Referral tiers - public read
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view referral tiers" ON referral_tiers
  FOR SELECT USING (true);

-- User referral profiles - users can see their own, others can see public info
ALTER TABLE user_referral_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referral profile" ON user_referral_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public referral info" ON user_referral_profiles
  FOR SELECT USING (is_active = true) -- For vanity slug lookups;

-- OG image templates - public read for active templates
ALTER TABLE og_image_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active OG templates" ON og_image_templates
  FOR SELECT USING (is_active = true);

-- User OG images - users can see their own
ALTER TABLE user_og_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own OG images" ON user_og_images
  FOR SELECT USING (auth.uid() = user_id);

-- Functions

-- Function to participate in daily challenge
CREATE OR REPLACE FUNCTION participate_in_daily_challenge(
  user_uuid UUID,
  challenge_uuid UUID,
  reel_uuid UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  challenge_record RECORD;
  participation_id UUID;
  credits_awarded INTEGER;
  streak_record RECORD;
  transaction_id UUID;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record
  FROM daily_challenges
  WHERE id = challenge_uuid AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;
  
  -- Check if user already participated today
  IF EXISTS (
    SELECT 1 FROM daily_challenge_participations 
    WHERE user_id = user_uuid AND challenge_id = challenge_uuid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already participated in today\'s challenge');
  END IF;
  
  -- Record participation
  INSERT INTO daily_challenge_participations (user_id, challenge_id, credits_awarded, reel_id)
  VALUES (user_uuid, challenge_uuid, challenge_record.bonus_credits, reel_uuid)
  RETURNING id INTO participation_id;
  
  -- Update/create user streak
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_challenges_completed)
  VALUES (user_uuid, 1, 1, CURRENT_DATE, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN 
        user_streaks.current_streak + 1
      WHEN user_streaks.last_activity_date = CURRENT_DATE THEN 
        user_streaks.current_streak -- Same day, don't change
      ELSE 1 -- Streak broken, restart
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN 
          user_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = CURRENT_DATE,
    total_challenges_completed = user_streaks.total_challenges_completed + 1,
    updated_at = NOW()
  RETURNING current_streak, longest_streak INTO streak_record;
  
  -- Award bonus credits for streaks
  credits_awarded := challenge_record.bonus_credits;
  IF streak_record.current_streak >= 7 THEN
    credits_awarded := credits_awarded + 50; -- Weekly streak bonus
  ELSIF streak_record.current_streak >= 3 THEN
    credits_awarded := credits_awarded + 15; -- 3-day streak bonus
  END IF;
  
  -- Add credits to user account
  SELECT add_user_credits(
    user_uuid,
    credits_awarded,
    'Daily Challenge: ' || challenge_record.title,
    'bonus',
    NULL, NULL, NULL, NULL, NULL,
    jsonb_build_object('challenge_id', challenge_uuid, 'participation_id', participation_id)
  ) INTO transaction_id;
  
  -- Update participation with actual credits awarded
  UPDATE daily_challenge_participations
  SET credits_awarded = credits_awarded
  WHERE id = participation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'participation_id', participation_id,
    'credits_awarded', credits_awarded,
    'current_streak', streak_record.current_streak,
    'longest_streak', streak_record.longest_streak,
    'transaction_id', transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update referral tier
CREATE OR REPLACE FUNCTION update_referral_tier(user_uuid UUID)
RETURNS referral_tier AS $$
DECLARE
  current_referrals INTEGER;
  new_tier referral_tier;
  tier_record RECORD;
  profile_record RECORD;
BEGIN
  -- Get current referral stats
  SELECT total_referrals, current_tier INTO current_referrals, new_tier
  FROM user_referral_profiles
  WHERE user_id = user_uuid;
  
  -- Determine new tier based on referral count
  SELECT tier INTO new_tier
  FROM referral_tiers
  WHERE min_referrals <= current_referrals
  ORDER BY min_referrals DESC
  LIMIT 1;
  
  -- Update user's tier if changed
  UPDATE user_referral_profiles
  SET 
    current_tier = new_tier,
    tier_progress = current_referrals - (
      SELECT min_referrals FROM referral_tiers WHERE tier = new_tier
    ),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; -- Exclude O, 0 for clarity
  result TEXT := '';
  i INTEGER;
  char_pos INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    char_pos := floor(random() * length(chars) + 1);
    result := result || substr(chars, char_pos, 1);
  END LOOP;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM user_referral_profiles WHERE referral_code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      char_pos := floor(random() * length(chars) + 1);
      result := result || substr(chars, char_pos, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create referral profile
CREATE OR REPLACE FUNCTION create_referral_profile(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
  ref_code VARCHAR(20);
BEGIN
  -- Generate unique referral code
  SELECT generate_referral_code() INTO ref_code;
  
  -- Create referral profile
  INSERT INTO user_referral_profiles (
    user_id, 
    referral_code, 
    current_tier
  ) VALUES (
    user_uuid, 
    ref_code, 
    'bronze'
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER update_daily_challenges_updated_at BEFORE UPDATE ON daily_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_profiles_updated_at BEFORE UPDATE ON user_referral_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert referral tier definitions
INSERT INTO referral_tiers (tier, min_referrals, credits_per_referral, bonus_multiplier, tier_bonus_credits, perks) VALUES
  ('bronze', 0, 25, 1.0, 0, '["Basic referral tracking"]'),
  ('silver', 5, 30, 1.2, 100, '["20% bonus credits", "Priority support", "Silver badge"]'),
  ('gold', 25, 40, 1.5, 500, '["50% bonus credits", "VIP support", "Gold badge", "Early access features"]'),
  ('platinum', 100, 50, 2.0, 2000, '["100% bonus credits", "Personal account manager", "Platinum badge", "Exclusive features", "Revenue sharing"]');

-- Insert sample daily challenges for the next 7 days
INSERT INTO daily_challenges (challenge_date, theme, title, description, prompt_template, bonus_credits) VALUES
  (CURRENT_DATE, 'romantic_sunset', 'Golden Hour Romance', 'Create a dreamy sunset pre-wedding shoot with warm golden lighting', 'Generate a romantic pre-wedding photo during golden hour with warm sunset lighting, couple silhouetted against the sky', 25),
  (CURRENT_DATE + 1, 'bollywood_glam', 'Bollywood Glamour', 'Channel your inner Bollywood star with dramatic poses and rich colors', 'Create a dramatic Bollywood-style pre-wedding photo with vibrant colors, elaborate outfits, and cinematic poses', 25),
  (CURRENT_DATE + 2, 'vintage_classic', 'Vintage Elegance', 'Step back in time with classic vintage styling and timeless poses', 'Generate a vintage-style pre-wedding photo with classic 1950s styling, black and white or sepia tones', 25),
  (CURRENT_DATE + 3, 'modern_chic', 'Modern Minimalist', 'Embrace contemporary style with clean lines and modern aesthetics', 'Create a modern minimalist pre-wedding photo with clean lines, contemporary styling, and urban backdrop', 25),
  (CURRENT_DATE + 4, 'cultural_fusion', 'Cultural Celebration', 'Blend traditional and modern elements in your cultural wedding style', 'Generate a pre-wedding photo that beautifully blends traditional cultural elements with modern touches', 25),
  (CURRENT_DATE + 5, 'destination_wedding', 'Exotic Destination', 'Dream of your perfect destination wedding location', 'Create a destination wedding-style photo in an exotic location like Bali, Santorini, or Maldives', 25),
  (CURRENT_DATE + 6, 'minimalist_elegance', 'Pure Elegance', 'Focus on the pure beauty of love with elegant, simple compositions', 'Generate an elegantly simple pre-wedding photo focusing on pure emotion and beautiful composition', 25);

-- Insert sample OG image templates
INSERT INTO og_image_templates (name, template_type, svg_template, variables, dimensions) VALUES
  ('Tournament Winner', 'tournament', 
   '<svg width="1200" height="630"><rect width="1200" height="630" fill="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"/><text x="600" y="300" text-anchor="middle" fill="white" font-size="48" font-weight="bold">{userName} Won!</text><text x="600" y="370" text-anchor="middle" fill="white" font-size="32">{tournamentName}</text></svg>',
   '{"userName": "User Name", "tournamentName": "Tournament Name"}',
   '{"width": 1200, "height": 630}'),
  ('Daily Challenge', 'challenge',
   '<svg width="1200" height="630"><rect width="1200" height="630" fill="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"/><text x="600" y="280" text-anchor="middle" fill="white" font-size="40" font-weight="bold">Daily Challenge</text><text x="600" y="340" text-anchor="middle" fill="white" font-size="32">{challengeTitle}</text><text x="600" y="400" text-anchor="middle" fill="white" font-size="24">{userName} completed the challenge!</text></svg>',
   '{"userName": "User Name", "challengeTitle": "Challenge Title"}',
   '{"width": 1200, "height": 630}');

-- Grant permissions
GRANT SELECT ON daily_challenges TO authenticated;
GRANT SELECT ON daily_challenge_participations TO authenticated;
GRANT SELECT ON user_streaks TO authenticated;
GRANT SELECT ON referral_tiers TO authenticated;
GRANT SELECT ON user_referral_profiles TO authenticated;
GRANT SELECT ON og_image_templates TO authenticated;
GRANT SELECT ON user_og_images TO authenticated;
GRANT EXECUTE ON FUNCTION participate_in_daily_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION update_referral_tier TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION create_referral_profile TO authenticated;

-- Create initial referral profiles for existing users
INSERT INTO user_referral_profiles (user_id, referral_code, current_tier)
SELECT 
  id, 
  generate_referral_code(),
  'bronze'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Create initial streak records for existing users  
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
SELECT id, 0, 0, NULL FROM auth.users
ON CONFLICT (user_id) DO NOTHING;