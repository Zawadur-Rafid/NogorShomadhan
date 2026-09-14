-- Migration: Add forum moderation events to the notification_type enum.
-- Run this file ON ITS OWN, before supabase_forum_moderation_triggers.sql.
-- PostgreSQL cannot use a new enum value inside the same transaction that adds
-- it, which is why these three statements are kept out of the trigger script
-- (same pattern as supabase_notification_types_update.sql).

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'forum_post_review_required';

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'forum_post_approved';

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'forum_post_rejected';
