-- User-defined personal health goals with progress tracking
CREATE TABLE IF NOT EXISTS user_health_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- e.g., "Walk 10k steps daily"
    category TEXT NOT NULL,                -- steps, sleep, activity, diet, stress, custom
    target_value NUMERIC NOT NULL,         -- e.g., 10000
    current_value NUMERIC DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '',         -- e.g., "steps", "hours", "score"
    frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Weekly digest snapshots (auto-generated each Sunday)
CREATE TABLE IF NOT EXISTS weekly_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    avg_sleep NUMERIC,
    avg_activity NUMERIC,
    avg_stress NUMERIC,
    avg_diet NUMERIC,
    total_entries INTEGER DEFAULT 0,
    streak_at_end INTEGER DEFAULT 0,
    health_score NUMERIC,
    comparison_direction TEXT DEFAULT 'stable', -- improving, stable, declining
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_user_health_goals_user ON user_health_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_digests_user ON weekly_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_digests_week ON weekly_digests(week_start);
