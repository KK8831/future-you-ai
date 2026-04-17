-- Achievement definitions (master catalog)
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,            -- emoji or icon key
    category TEXT NOT NULL,        -- streak, social, logging, ai, health
    tier TEXT NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, diamond
    requirement_value INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User achievements (earned badges)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, achievement_id)
);

-- Add XP & level to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Seed the achievement catalog with 15 achievements
INSERT INTO achievements (id, name, description, icon, category, tier, requirement_value, xp_reward) VALUES
    -- Streak achievements
    ('streak_3',      'Getting Started',     'Maintain a 3-day logging streak',              '🔥', 'streak',  'bronze',  3,    25),
    ('streak_7',      'Week Warrior',        'Maintain a 7-day logging streak',              '⚡', 'streak',  'silver',  7,    50),
    ('streak_30',     'Monthly Machine',     'Maintain a 30-day logging streak',             '🏆', 'streak',  'gold',    30,   200),
    ('streak_100',    'Century Club',        'Maintain a 100-day logging streak',            '💎', 'streak',  'diamond', 100,  1000),
    -- Logging achievements
    ('log_1',         'First Step',          'Log your very first lifestyle entry',          '📝', 'logging', 'bronze',  1,    10),
    ('log_10',        'Data Driven',         'Log 10 lifestyle entries',                     '📊', 'logging', 'silver',  10,   50),
    ('log_50',        'Habit Builder',       'Log 50 lifestyle entries',                     '🧱', 'logging', 'gold',    50,   150),
    ('log_100',       'Centurion Logger',    'Log 100 lifestyle entries',                    '🏛️', 'logging', 'diamond', 100,  500),
    -- AI achievements
    ('ai_first',      'AI Explorer',         'Run your first AI health analysis',            '🤖', 'ai',      'bronze',  1,    25),
    ('ai_5',          'Pattern Seeker',      'Run 5 AI analyses on your data',               '🔬', 'ai',      'silver',  5,    75),
    -- Health achievements
    ('sleep_perfect', 'Sleep Champion',      'Log 8+ hours of sleep for 7 consecutive days', '😴', 'health',  'gold',    7,    100),
    ('activity_star', 'Movement Master',     'Log 60+ min activity for 5 consecutive days',  '🏃', 'health',  'silver',  5,    75),
    ('zen_master',    'Zen Master',          'Maintain stress level ≤ 3 for 7 days',         '🧘', 'health',  'gold',    7,    100),
    -- Social achievements
    ('social_first',  'Social Butterfly',    'Add your first friend',                        '🦋', 'social',  'bronze',  1,    25),
    ('challenge_join','Arena Fighter',       'Join your first health challenge',              '⚔️', 'social',  'bronze',  1,    25)
ON CONFLICT (id) DO NOTHING;
