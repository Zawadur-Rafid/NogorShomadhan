-- Migration: Record who performed each admin action, so the admin activity log
-- can be built the same way the authority one is.
--
-- Authority actions already write an actor column (complaint_status_history,
-- complaint_work_updates, contractor_history, complaint_resolution). Admin
-- actions did not, which is what this migration fixes.
--
-- Already attributable before this file:
--   forum moderation  -> forum_posts.reviewed_by   (supabase_forum_moderation.sql)
--   official posts    -> forum_posts.acc_id
--   forum comments    -> forum_comments.acc_id
--   system settings   -> app_settings.updated_by_acc_id

-- 1. Duplicate review: record which admin decided.
--    NOTE: duplicate.acc_id already points at account, so this is a second
--    foreign key to the same table. Any PostgREST query that embeds account on
--    duplicate must from now on name the constraint
--    (account!duplicate_acc_id_fkey), or it fails with PGRST201.
ALTER TABLE duplicate
    ADD COLUMN IF NOT EXISTS reviewed_by UUID
        REFERENCES account(acc_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_duplicate_reviewed_by
    ON duplicate(reviewed_by, reviewed_at DESC);

-- 2. Account review: rejecting an account DELETES the row, so the decision
--    cannot be stored on the account itself. This log keeps a snapshot of who
--    was reviewed, by whom, and what was decided.
CREATE TABLE IF NOT EXISTS account_review_log (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acc_id UUID REFERENCES account(acc_id) ON DELETE SET NULL,
    full_name TEXT,
    username TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    reviewed_by UUID REFERENCES account(acc_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_review_log_reviewer
    ON account_review_log(reviewed_by, reviewed_at DESC);

ALTER TABLE account_review_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Enable select for public" ON account_review_log
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for public" ON account_review_log
        FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMENT ON TABLE account_review_log IS
    'Audit trail of admin decisions on resident accounts. Rejected accounts are deleted, so name and username are snapshotted here.';
COMMENT ON COLUMN duplicate.reviewed_by IS
    'Admin who confirmed or rejected this duplicate match.';
