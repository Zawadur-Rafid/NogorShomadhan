-- Migration: Complaint Feedback and Authority Replies Schema with RLS
-- Description: Creates complaint_feedback and feedback_replies tables with foreign keys and RLS policies

-- 1. Create complaint_feedback Table (Stores resident feedback ratings and comments for resolved complaints)
CREATE TABLE IF NOT EXISTS complaint_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comp_id UUID REFERENCES complaints(comp_id) ON DELETE CASCADE NOT NULL,
    acc_id UUID REFERENCES account(acc_id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create feedback_replies Table (Stores authority replies to resident feedback comments)
CREATE TABLE IF NOT EXISTS feedback_replies (
    reply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES complaint_feedback(feedback_id) ON DELETE CASCADE NOT NULL,
    acc_id UUID REFERENCES account(acc_id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_complaint_feedback_comp_id ON complaint_feedback(comp_id);
CREATE INDEX IF NOT EXISTS idx_complaint_feedback_acc_id ON complaint_feedback(acc_id);
CREATE INDEX IF NOT EXISTS idx_complaint_feedback_created_at ON complaint_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_replies_feedback_id ON feedback_replies(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_replies_acc_id ON feedback_replies(acc_id);
CREATE INDEX IF NOT EXISTS idx_feedback_replies_created_at ON feedback_replies(created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE complaint_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for complaint_feedback
DO $$ BEGIN
    CREATE POLICY "Enable select for public" ON complaint_feedback FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for public" ON complaint_feedback FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for public" ON complaint_feedback FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for public" ON complaint_feedback FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. RLS Policies for feedback_replies
DO $$ BEGIN
    CREATE POLICY "Enable select for public" ON feedback_replies FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for public" ON feedback_replies FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for public" ON feedback_replies FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for public" ON feedback_replies FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
