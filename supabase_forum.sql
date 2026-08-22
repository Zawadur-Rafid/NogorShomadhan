-- Migration: Forum Posts, Comments & Replies Schema with RLS
-- Description: Creates forum_posts and forum_comments tables with foreign keys and RLS policies

-- 1. Create Enum for Forum Post Types
DO $$ BEGIN
    CREATE TYPE forum_post_type AS ENUM ('Announcement', 'Update', 'Alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create forum_posts Table
CREATE TABLE IF NOT EXISTS forum_posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acc_id UUID REFERENCES account(acc_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status forum_post_type DEFAULT 'Update'::forum_post_type NOT NULL,
    is_official BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create forum_comments Table (Stores top-level comments and replies to specific comments)
CREATE TABLE IF NOT EXISTS forum_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES forum_posts(post_id) ON DELETE CASCADE NOT NULL,
    acc_id UUID REFERENCES account(acc_id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES forum_comments(comment_id) ON DELETE CASCADE NULL,
    content TEXT NOT NULL,
    is_official BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_acc_id ON forum_posts(acc_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id ON forum_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_acc_id ON forum_comments(acc_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for forum_posts
DO $$ BEGIN
    CREATE POLICY "Enable select for public" ON forum_posts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for public" ON forum_posts FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for public" ON forum_posts FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for public" ON forum_posts FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. RLS Policies for forum_comments
DO $$ BEGIN
    CREATE POLICY "Enable select for public" ON forum_comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for public" ON forum_comments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for public" ON forum_comments FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for public" ON forum_comments FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
