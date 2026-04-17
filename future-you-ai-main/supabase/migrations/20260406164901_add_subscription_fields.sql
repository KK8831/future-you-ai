-- Add subscription_tier and api_credits to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS api_credits INTEGER DEFAULT 3;

-- Optional: Create an index for quick querying of users who have premium
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
