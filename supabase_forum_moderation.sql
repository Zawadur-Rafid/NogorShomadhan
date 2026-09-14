-- Migration: Admin verification workflow for resident forum posts
-- Description: Resident posts enter the forum as 'pending' and stay hidden from
--              the community until an admin approves them. Official posts from
--              admin/authority accounts are approved on insert.
--
-- Run order:
--   1. supabase_forum.sql                     (existing)
--   2. supabase_forum_moderation.sql          <- this file
--   3. supabase_forum_moderation_types.sql    (run alone, adds enum values)
--   4. supabase_forum_moderation_triggers.sql (notification triggers)

-- 1. Moderation state
DO $$ BEGIN
    CREATE TYPE forum_moderation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Moderation columns on forum_posts.
--    The column is created with DEFAULT 'approved' so every post that already
--    exists stays visible, then the default flips to 'pending' so new posts
--    must be reviewed. Both statements are safe to re-run.
ALTER TABLE forum_posts
    ADD COLUMN IF NOT EXISTS moderation_status forum_moderation_status
        NOT NULL DEFAULT 'approved';

ALTER TABLE forum_posts
    ALTER COLUMN moderation_status SET DEFAULT 'pending';

ALTER TABLE forum_posts
    ADD COLUMN IF NOT EXISTS reviewed_by UUID
        REFERENCES account(acc_id) ON DELETE SET NULL;

ALTER TABLE forum_posts
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE forum_posts
    ADD COLUMN IF NOT EXISTS rejection_note TEXT;

-- 3. A rejected post can never exist without a reason for the author.
ALTER TABLE forum_posts
    DROP CONSTRAINT IF EXISTS forum_posts_rejection_note_required;

ALTER TABLE forum_posts
    ADD CONSTRAINT forum_posts_rejection_note_required
    CHECK (
        moderation_status <> 'rejected'
        OR (rejection_note IS NOT NULL AND length(trim(rejection_note)) > 0)
    );

-- 4. Indexes for the admin review queue and the filtered community feed.
CREATE INDEX IF NOT EXISTS idx_forum_posts_pending_review
    ON forum_posts(created_at DESC)
    WHERE moderation_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_forum_posts_moderation_status
    ON forum_posts(moderation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_posts_author_moderation
    ON forum_posts(acc_id, moderation_status);

-- 5. Enforce the workflow in the database.
--    This project has no Supabase Auth session, so auth.uid() is unavailable and
--    RLS cannot identify the caller. Trust is therefore derived from the author's
--    role in the account table instead of from client-supplied fields: a resident
--    cannot self-approve a post or forge the official badge even by calling the
--    REST API directly.
CREATE OR REPLACE FUNCTION forum_post_apply_moderation_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    author_role TEXT;
BEGIN
    SELECT role::TEXT INTO author_role
    FROM account
    WHERE acc_id = NEW.acc_id;

    IF TG_OP = 'INSERT' THEN
        IF author_role IN ('admin', 'authority') THEN
            -- Official sources publish immediately and are their own reviewer.
            NEW.moderation_status := 'approved';
            NEW.reviewed_by := NEW.acc_id;
            NEW.reviewed_at := CURRENT_TIMESTAMP;
            NEW.rejection_note := NULL;
        ELSE
            -- Residents always queue for admin review, whatever the client sent.
            NEW.is_official := FALSE;
            NEW.moderation_status := 'pending';
            NEW.reviewed_by := NULL;
            NEW.reviewed_at := NULL;
            NEW.rejection_note := NULL;
        END IF;

        RETURN NEW;
    END IF;

    -- UPDATE: stamp the review time and keep the rejection note consistent.
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
        IF NEW.moderation_status = 'pending' THEN
            NEW.reviewed_by := NULL;
            NEW.reviewed_at := NULL;
        ELSE
            NEW.reviewed_at := CURRENT_TIMESTAMP;
        END IF;
    END IF;

    IF NEW.moderation_status <> 'rejected' THEN
        NEW.rejection_note := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_post_moderation_rules ON forum_posts;
CREATE TRIGGER trg_forum_post_moderation_rules
BEFORE INSERT OR UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION forum_post_apply_moderation_rules();

COMMENT ON COLUMN forum_posts.moderation_status IS
    'pending until an admin reviews a resident post; official posts are approved on insert.';
COMMENT ON COLUMN forum_posts.rejection_note IS
    'Admin-written reason shown to the author when a post is rejected.';
COMMENT ON FUNCTION forum_post_apply_moderation_rules() IS
    'Forces resident posts into admin review and keeps reviewer/rejection fields consistent.';
