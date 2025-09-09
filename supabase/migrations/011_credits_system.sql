-- Credits System Migration
-- This migration adds the complete credits and payments system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Credit plans enum
CREATE TYPE credit_plan_type AS ENUM ('starter', 'pro');

-- Credit transaction types enum
CREATE TYPE credit_transaction_type AS ENUM (
  'purchase',         -- Credits bought
  'reel_generation',  -- Credits spent on reel generation
  'bonus',           -- Bonus credits (referrals, promos)
  'refund',          -- Refunded credits
  'admin_adjustment' -- Manual admin adjustment
);

-- Credit plans table (defines available purchase plans)
CREATE TABLE credit_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  plan_type credit_plan_type NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, -- Price in cents (USD)
  stripe_price_id VARCHAR(255) UNIQUE,
  description TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credit wallets table
CREATE TABLE user_credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0, -- Current credit balance
  lifetime_earned INTEGER NOT NULL DEFAULT 0, -- Total credits ever earned
  lifetime_spent INTEGER NOT NULL DEFAULT 0, -- Total credits ever spent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Credit transactions table (complete ledger)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits spent
  balance_after INTEGER NOT NULL, -- User's balance after this transaction
  description TEXT NOT NULL,
  
  -- Payment-related fields
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  plan_id UUID REFERENCES credit_plans(id),
  
  -- Reel generation fields
  reel_id UUID, -- References to reel generation (if applicable)
  
  -- Promo/referral fields
  promo_code VARCHAR(100),
  referral_user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  credits INTEGER NOT NULL, -- Credits to award
  max_uses INTEGER, -- NULL for unlimited
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promo code redemptions table
CREATE TABLE promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_awarded INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id) -- Prevent double redemption
);

-- User referrals table
CREATE TABLE user_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(100) NOT NULL,
  credits_awarded INTEGER DEFAULT 0, -- Credits awarded to referrer
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, expired
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Indexes for performance
CREATE INDEX idx_user_credit_wallets_user_id ON user_credit_wallets(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_stripe_payment ON credit_transactions(stripe_payment_intent_id);
CREATE INDEX idx_credit_transactions_stripe_session ON credit_transactions(stripe_checkout_session_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_code_redemptions_user_id ON promo_code_redemptions(user_id);
CREATE INDEX idx_user_referrals_referrer_id ON user_referrals(referrer_id);
CREATE INDEX idx_user_referrals_referred_id ON user_referrals(referred_id);

-- RLS Policies

-- Credit plans - public read access
ALTER TABLE credit_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active credit plans" ON credit_plans
  FOR SELECT USING (is_active = true);

-- User credit wallets - users can only see their own
ALTER TABLE user_credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wallet" ON user_credit_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions - users can only see their own
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Promo codes - public read for active codes (for validation)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true AND valid_until > NOW());

-- Promo code redemptions - users can see their own
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own redemptions" ON promo_code_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- User referrals - users can see referrals they made or were part of
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their referrals" ON user_referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Functions

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(balance, 0) INTO balance
  FROM user_credit_wallets
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user wallet (transaction safe)
CREATE OR REPLACE FUNCTION add_user_credits(
  user_uuid UUID,
  credit_amount INTEGER,
  transaction_desc TEXT,
  trans_type credit_transaction_type DEFAULT 'purchase',
  payment_intent_id VARCHAR(255) DEFAULT NULL,
  checkout_session_id VARCHAR(255) DEFAULT NULL,
  plan_uuid UUID DEFAULT NULL,
  promo_code_text VARCHAR(100) DEFAULT NULL,
  referrer_uuid UUID DEFAULT NULL,
  meta_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  transaction_id UUID;
BEGIN
  -- Get or create wallet
  INSERT INTO user_credit_wallets (user_id, balance)
  VALUES (user_uuid, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance with row lock
  SELECT balance INTO current_balance
  FROM user_credit_wallets
  WHERE user_id = user_uuid
  FOR UPDATE;
  
  new_balance := current_balance + credit_amount;
  
  -- Update wallet balance and lifetime stats
  UPDATE user_credit_wallets
  SET 
    balance = new_balance,
    lifetime_earned = CASE 
      WHEN credit_amount > 0 THEN lifetime_earned + credit_amount
      ELSE lifetime_earned
    END,
    lifetime_spent = CASE 
      WHEN credit_amount < 0 THEN lifetime_spent + ABS(credit_amount)
      ELSE lifetime_spent
    END,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after, description,
    stripe_payment_intent_id, stripe_checkout_session_id, plan_id,
    promo_code, referral_user_id, metadata
  ) VALUES (
    user_uuid, trans_type, credit_amount, new_balance, transaction_desc,
    payment_intent_id, checkout_session_id, plan_uuid,
    promo_code_text, referrer_uuid, meta_data
  )
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits (returns false if insufficient funds)
CREATE OR REPLACE FUNCTION spend_user_credits(
  user_uuid UUID,
  credit_cost INTEGER,
  transaction_desc TEXT,
  reel_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance with row lock
  SELECT balance INTO current_balance
  FROM user_credit_wallets
  WHERE user_id = user_uuid
  FOR UPDATE;
  
  -- Check if user has sufficient credits
  IF current_balance < credit_cost THEN
    RETURN FALSE;
  END IF;
  
  new_balance := current_balance - credit_cost;
  
  -- Update wallet
  UPDATE user_credit_wallets
  SET 
    balance = new_balance,
    lifetime_spent = lifetime_spent + credit_cost,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after, description, reel_id
  ) VALUES (
    user_uuid, 'reel_generation', -credit_cost, new_balance, transaction_desc, reel_uuid
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem promo code
CREATE OR REPLACE FUNCTION redeem_promo_code(
  user_uuid UUID,
  code_text VARCHAR(100)
)
RETURNS JSONB AS $$
DECLARE
  promo_record RECORD;
  redemption_id UUID;
  transaction_id UUID;
BEGIN
  -- Find and validate promo code
  SELECT * INTO promo_record
  FROM promo_codes
  WHERE code = code_text
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (max_uses IS NULL OR uses_count < max_uses)
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired promo code');
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM promo_code_redemptions 
    WHERE promo_code_id = promo_record.id AND user_id = user_uuid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo code already redeemed');
  END IF;
  
  -- Record redemption
  INSERT INTO promo_code_redemptions (promo_code_id, user_id, credits_awarded)
  VALUES (promo_record.id, user_uuid, promo_record.credits)
  RETURNING id INTO redemption_id;
  
  -- Update promo code usage count
  UPDATE promo_codes
  SET uses_count = uses_count + 1, updated_at = NOW()
  WHERE id = promo_record.id;
  
  -- Add credits to user
  SELECT add_user_credits(
    user_uuid,
    promo_record.credits,
    'Promo code redemption: ' || code_text,
    'bonus',
    NULL, NULL, NULL,
    code_text
  ) INTO transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_awarded', promo_record.credits,
    'redemption_id', redemption_id,
    'transaction_id', transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger to maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credit_plans_updated_at BEFORE UPDATE ON credit_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credit_wallets_updated_at BEFORE UPDATE ON user_credit_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default credit plans
INSERT INTO credit_plans (name, plan_type, credits, price_cents, description, features, sort_order) VALUES
  ('Starter Pack', 'starter', 50, 999, 'Perfect for trying out our AI reel generation', 
   '["50 Credits", "Basic Support", "Standard Quality"]', 1),
  ('Pro Pack', 'pro', 200, 2999, 'Best value for regular users and content creators',
   '["200 Credits", "Priority Support", "HD Quality", "Early Access Features"]', 2);

-- Insert some sample promo codes for testing
INSERT INTO promo_codes (code, credits, max_uses, description, valid_until) VALUES
  ('WELCOME50', 50, 1000, 'Welcome bonus for new users', NOW() + INTERVAL '30 days'),
  ('BETA100', 100, 500, 'Beta tester bonus', NOW() + INTERVAL '60 days'),
  ('FRIEND25', 25, NULL, 'Friend referral bonus', NOW() + INTERVAL '365 days');

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON credit_plans TO authenticated;
GRANT SELECT ON user_credit_wallets TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON promo_codes TO authenticated;
GRANT SELECT ON promo_code_redemptions TO authenticated;
GRANT SELECT ON user_referrals TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION spend_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_promo_code TO authenticated;

-- Create initial wallets for existing users (if any)
INSERT INTO user_credit_wallets (user_id, balance)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;