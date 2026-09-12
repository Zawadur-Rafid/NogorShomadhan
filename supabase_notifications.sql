-- Migration: Shared notification inbox for resident, admin, and authority accounts
-- Apply this after the account, complaints, forum, and feedback tables exist.

-- Notification names describe the event that happened, not the screen that renders it.
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'account_review_required',
        'account_approved',
        'account_rejected',
        'complaint_review_required',
        'duplicate_review_required',
        'complaint_accepted',
        'complaint_rejected',
        'complaint_duplicate_confirmed',
        'complaint_work_started',
        'complaint_pending_stale',
        'complaint_progress_updated',
        'complaint_deadline_changed',
        'complaint_deadline_milestone',
        'complaint_overdue',
        'complaint_resolved',
        'complaint_feedback_received',
        'complaint_feedback_replied',
        'forum_discussion_created',
        'forum_comment_received',
        'forum_reply_received',
        'official_announcement',
        'system_alert'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_entity_type AS ENUM (
        'account',
        'complaint',
        'feedback',
        'forum_post',
        'forum_comment',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_acc_id UUID REFERENCES account(acc_id) ON DELETE CASCADE NOT NULL,
    actor_acc_id UUID REFERENCES account(acc_id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    entity_type notification_entity_type NOT NULL,
    entity_id UUID,
    event_key TEXT NOT NULL CHECK (length(trim(event_key)) > 0),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    body TEXT NOT NULL CHECK (length(trim(body)) > 0),
    action_path TEXT CHECK (action_path IS NULL OR action_path LIKE '/%'),
    data JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
    priority notification_priority NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    seen_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    push_sent_at TIMESTAMPTZ,

    CONSTRAINT notifications_recipient_event_unique
        UNIQUE (recipient_acc_id, event_key),
    CONSTRAINT notifications_no_self_notification
        CHECK (actor_acc_id IS NULL OR actor_acc_id <> recipient_acc_id),
    CONSTRAINT notifications_seen_time_valid
        CHECK (seen_at IS NULL OR seen_at >= created_at),
    CONSTRAINT notifications_read_time_valid
        CHECK (read_at IS NULL OR read_at >= created_at),
    CONSTRAINT notifications_push_time_valid
        CHECK (push_sent_at IS NULL OR push_sent_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON notifications(recipient_acc_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications(recipient_acc_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_entity
    ON notifications(entity_type, entity_id)
    WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type_created
    ON notifications(type, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Demo access model
-- The current app uses the Supabase anonymous client and filters notification rows
-- by the acc_id stored locally after sign-in. These policies intentionally match the
-- public-access approach used by the rest of this university project.
DO $$ BEGIN
    CREATE POLICY "Enable select for public"
        ON notifications
        FOR SELECT
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for public"
        ON notifications
        FOR INSERT
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for public"
        ON notifications
        FOR UPDATE
        USING (true)
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TABLE notifications IS
    'Persistent per-account inbox shared by residents, admins, and the community authority.';

COMMENT ON COLUMN notifications.event_key IS
    'Stable event identifier used with recipient_acc_id to prevent duplicate delivery.';

COMMENT ON COLUMN notifications.action_path IS
    'Internal Expo Router path opened when the recipient selects the notification.';

COMMENT ON COLUMN notifications.data IS
    'Small event metadata object; do not store secrets or full entity records here.';

-- No DELETE policy is provided. Notification history is retained; clients mark rows
-- as seen/read through timestamps instead of deleting them.
