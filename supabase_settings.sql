-- Migration: System Settings Schema with RLS
-- Description: Creates the app_settings singleton table used by the admin System Settings page.
-- The table stores exactly one row (id = 1) holding all admin toggles and configuration.

-- 1. Create app_settings Table (Singleton row id = 1)
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    ai_auto_categorize BOOLEAN NOT NULL DEFAULT TRUE,
    duplicate_detection BOOLEAN NOT NULL DEFAULT TRUE,
    duplicate_threshold_percent INTEGER NOT NULL DEFAULT 85 CHECK (duplicate_threshold_percent IN (50, 70, 85)),
    duplicate_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    new_account_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by_acc_id UUID REFERENCES account(acc_id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Seed the singleton row so the app can read settings immediately
INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for app_settings (matches the project's anonymous-client model)
DO $$ BEGIN
    CREATE POLICY "Enable select for public" ON app_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for public" ON app_settings FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;