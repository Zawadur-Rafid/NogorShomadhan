-- Migration: Add duplicate-review events to an existing notification_type enum.
-- Run this once before applying notification-generation triggers.

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'duplicate_review_required';

ALTER TYPE notification_type
    ADD VALUE IF NOT EXISTS 'complaint_duplicate_confirmed';
