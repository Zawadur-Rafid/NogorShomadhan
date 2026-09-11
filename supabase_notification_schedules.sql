-- Migration: Generate time-based notification events.
-- Run after:
--   1. supabase_notifications.sql
--   2. supabase_notification_types_update.sql
--   3. supabase_notification_triggers.sql

-- Supabase Cron uses pg_cron to execute database functions on a schedule.
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION generate_stale_pending_complaint_notifications()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO notifications (
        recipient_acc_id,
        actor_acc_id,
        type,
        entity_type,
        entity_id,
        event_key,
        title,
        body,
        action_path,
        data,
        priority
    )
    SELECT
        authority.acc_id,
        NULL,
        'complaint_pending_stale'::notification_type,
        'complaint'::notification_entity_type,
        complaint.comp_id,
        'complaint:' || complaint.comp_id::TEXT || ':pending-stale:14d',
        'Pending complaint needs attention',
        notification_complaint_label(complaint.comp_id) || ' — "' ||
            complaint.title ||
            '" has remained pending for 14 days without work being started.',
        '/authority/complaints/' || complaint.comp_id::TEXT,
        JSONB_BUILD_OBJECT(
            'complaint_id', complaint.comp_id,
            'complaint_label', notification_complaint_label(complaint.comp_id),
            'pending_since', acceptance.pending_since,
            'pending_days', 14
        ),
        'high'::notification_priority
    FROM complaints AS complaint
    CROSS JOIN LATERAL (
        SELECT COALESCE(
            (
                SELECT MAX(history.changed_at)
                FROM complaint_status_history AS history
                WHERE history.comp_id = complaint.comp_id
                  AND history.from_status::TEXT = 'unverified'
                  AND history.to_status::TEXT = 'pending'
            ),
            (
                SELECT MIN(accepted_notification.created_at)
                FROM notifications AS accepted_notification
                WHERE accepted_notification.entity_id = complaint.comp_id
                  AND accepted_notification.type::TEXT = 'complaint_accepted'
                  AND accepted_notification.event_key =
                      'complaint:' || complaint.comp_id::TEXT || ':accepted:resident'
            )
        ) AS pending_since
    ) AS acceptance
    CROSS JOIN account AS authority
    WHERE complaint.status::TEXT = 'pending'
      AND acceptance.pending_since IS NOT NULL
      AND acceptance.pending_since <= CURRENT_TIMESTAMP - INTERVAL '14 days'
      AND authority.role::TEXT = 'authority'
      AND authority.status::TEXT = 'verified'
    ON CONFLICT (recipient_acc_id, event_key) DO NOTHING;
$$;

COMMENT ON FUNCTION generate_stale_pending_complaint_notifications() IS
    'Creates one authority reminder when an accepted complaint remains pending for 14 days.';

-- Runs every day at 03:00 UTC, which is 09:00 in Asia/Dhaka.
SELECT cron.schedule(
    'notify-stale-pending-complaints',
    '0 3 * * *',
    'SELECT public.generate_stale_pending_complaint_notifications();'
);
