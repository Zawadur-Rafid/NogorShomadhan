-- Migration: Add newer notification events to an existing notification_type enum.
-- Run this once before applying notification-generation triggers.

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'duplicate_review_required';

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'complaint_duplicate_confirmed';

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'complaint_pending_stale';

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'forum_discussion_created';
