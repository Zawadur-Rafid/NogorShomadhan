-- Migration: Generate persistent in-app notifications from application events.
-- Prerequisites:
--   1. supabase_notifications.sql
--   2. supabase_notification_types_update.sql
--
-- Duplicate relationship used by these triggers:
--   duplicate.comp_id = newly submitted candidate complaint
--   duplicate.matched_comp_id = canonical/original complaint
--   duplicate.acc_id = resident who submitted the candidate

-- Keep the confirmed duplicate row after its temporary candidate complaint is
-- removed. The canonical complaint remains referenced by duplicate.matched_comp_id.
ALTER TABLE duplicate
    ALTER COLUMN comp_id DROP NOT NULL;

ALTER TABLE duplicate
    DROP CONSTRAINT IF EXISTS duplicate_comp_id_fkey;

ALTER TABLE duplicate
    ADD CONSTRAINT duplicate_comp_id_fkey
    FOREIGN KEY (comp_id)
    REFERENCES complaints(comp_id)
    ON DELETE SET NULL;

-- The matched complaint is the canonical complaint and must remain available.
ALTER TABLE duplicate
    ALTER COLUMN matched_comp_id SET NOT NULL;

ALTER TABLE duplicate
    DROP CONSTRAINT IF EXISTS duplicate_matched_comp_id_fkey;

ALTER TABLE duplicate
    ADD CONSTRAINT duplicate_matched_comp_id_fkey
    FOREIGN KEY (matched_comp_id)
    REFERENCES complaints(comp_id);

CREATE OR REPLACE FUNCTION notification_complaint_label(p_comp_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (
            SELECT 'CMP-' || LPAD(ranked.sequence_number::TEXT, 2, '0')
            FROM (
                SELECT
                    comp_id,
                    ROW_NUMBER() OVER (
                        ORDER BY timestamp ASC NULLS FIRST, comp_id ASC
                    ) AS sequence_number
                FROM complaints
            ) AS ranked
            WHERE ranked.comp_id = p_comp_id
        ),
        'Complaint'
    );
$$;

CREATE OR REPLACE FUNCTION enqueue_notification(
    p_recipient_acc_id UUID,
    p_actor_acc_id UUID,
    p_type notification_type,
    p_entity_type notification_entity_type,
    p_entity_id UUID,
    p_event_key TEXT,
    p_title TEXT,
    p_body TEXT,
    p_action_path TEXT,
    p_data JSONB DEFAULT '{}'::JSONB,
    p_priority notification_priority DEFAULT 'normal'::notification_priority
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_recipient_acc_id IS NULL THEN
        RETURN;
    END IF;

    -- Actions should not notify the account that performed them.
    IF p_actor_acc_id IS NOT NULL AND p_actor_acc_id = p_recipient_acc_id THEN
        RETURN;
    END IF;

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
    VALUES (
        p_recipient_acc_id,
        p_actor_acc_id,
        p_type,
        p_entity_type,
        p_entity_id,
        p_event_key,
        p_title,
        p_body,
        p_action_path,
        COALESCE(p_data, '{}'::JSONB),
        p_priority
    )
    ON CONFLICT (recipient_acc_id, event_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION notification_forum_path(p_role account_role)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE p_role::TEXT
        WHEN 'admin' THEN '/(admin)/forum'
        WHEN 'authority' THEN '/authority/forum'
        ELSE '/(resident)/forum'
    END;
$$;

CREATE OR REPLACE FUNCTION notify_admins_about_account_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID;
BEGIN
    IF NEW.role::TEXT <> 'resident' OR NEW.status::TEXT <> 'unverified' THEN
        RETURN NEW;
    END IF;

    FOR admin_id IN
        SELECT acc_id
        FROM account
        WHERE role::TEXT = 'admin'
          AND status::TEXT = 'verified'
          AND acc_id <> NEW.acc_id
    LOOP
        PERFORM enqueue_notification(
            admin_id,
            NEW.acc_id,
            'account_review_required',
            'account',
            NEW.acc_id,
            'account:' || NEW.acc_id::TEXT || ':review',
            'New resident account',
            COALESCE(NULLIF(TRIM(NEW.full_name), ''), 'A resident') ||
                ' is waiting for account verification.',
            '/(admin)/accounts/pending',
            JSONB_BUILD_OBJECT('account_id', NEW.acc_id),
            'normal'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_account_review ON account;
CREATE TRIGGER trg_notify_admins_account_review
AFTER INSERT ON account
FOR EACH ROW
EXECUTE FUNCTION notify_admins_about_account_review();

CREATE OR REPLACE FUNCTION notify_admins_about_complaint_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID;
    complaint_label TEXT;
BEGIN
    IF NEW.status::TEXT <> 'unverified' THEN
        RETURN NEW;
    END IF;

    complaint_label := notification_complaint_label(NEW.comp_id);

    FOR admin_id IN
        SELECT acc_id
        FROM account
        WHERE role::TEXT = 'admin'
          AND status::TEXT = 'verified'
    LOOP
        PERFORM enqueue_notification(
            admin_id,
            NEW.acc_id,
            'complaint_review_required',
            'complaint',
            NEW.comp_id,
            'complaint:' || NEW.comp_id::TEXT || ':review',
            'New complaint for review',
            complaint_label || ' — "' || NEW.title ||
                '" is waiting for admin review.',
            '/(admin)/complaints/' || NEW.comp_id::TEXT,
            JSONB_BUILD_OBJECT(
                'complaint_id', NEW.comp_id,
                'complaint_label', complaint_label
            ),
            'normal'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_complaint_review ON complaints;
CREATE TRIGGER trg_notify_admins_complaint_review
AFTER INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION notify_admins_about_complaint_review();

CREATE OR REPLACE FUNCTION notify_about_duplicate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID;
    canonical_label TEXT;
    candidate_label TEXT;
    candidate_title TEXT;
BEGIN
    IF NEW.admin_status::TEXT <> 'pending' THEN
        RETURN NEW;
    END IF;

    canonical_label := notification_complaint_label(NEW.matched_comp_id);
    candidate_label := notification_complaint_label(NEW.comp_id);

    SELECT title
    INTO candidate_title
    FROM complaints
    WHERE comp_id = NEW.comp_id;

    -- A potential duplicate has its own review notification, so remove the ordinary
    -- complaint-review notification created for the candidate in the same workflow.
    DELETE FROM notifications
    WHERE type = 'complaint_review_required'
      AND entity_id = NEW.comp_id;

    FOR admin_id IN
        SELECT acc_id
        FROM account
        WHERE role::TEXT = 'admin'
          AND status::TEXT = 'verified'
    LOOP
        PERFORM enqueue_notification(
            admin_id,
            NEW.acc_id,
            'duplicate_review_required',
            'complaint',
            NEW.comp_id,
            'duplicate:' || NEW.dup_id::TEXT || ':review',
            'Possible duplicate complaint',
            candidate_label || ' — "' ||
                COALESCE(candidate_title, 'Submitted complaint') ||
                '" may be a duplicate of ' || canonical_label || '.',
            '/(admin)/complaints/' || NEW.comp_id::TEXT,
            JSONB_BUILD_OBJECT(
                'duplicate_id', NEW.dup_id,
                'candidate_complaint_id', NEW.comp_id,
                'candidate_complaint_label', candidate_label,
                'canonical_complaint_id', NEW.matched_comp_id,
                'canonical_complaint_label', canonical_label,
                'ai_score', NEW.ai_score,
                'ai_reason', NEW.ai_reason
            ),
            'high'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_duplicate_review ON duplicate;
CREATE TRIGGER trg_notify_duplicate_review
AFTER INSERT ON duplicate
FOR EACH ROW
EXECUTE FUNCTION notify_about_duplicate_review();

CREATE OR REPLACE FUNCTION notify_resident_duplicate_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    canonical_label TEXT;
    candidate_label TEXT;
    canonical_title TEXT;
BEGIN
    IF OLD.admin_status::TEXT = NEW.admin_status::TEXT
       OR NEW.admin_status::TEXT <> 'confirmed' THEN
        RETURN NEW;
    END IF;

    canonical_label := notification_complaint_label(NEW.matched_comp_id);
    candidate_label := notification_complaint_label(NEW.comp_id);

    SELECT title
    INTO canonical_title
    FROM complaints
    WHERE comp_id = NEW.matched_comp_id;

    PERFORM enqueue_notification(
        NEW.acc_id,
        NULL,
        'complaint_duplicate_confirmed',
        'complaint',
        NEW.matched_comp_id,
        'duplicate:' || NEW.dup_id::TEXT || ':confirmed',
        'Complaint linked to an existing report',
        'Your report ' || candidate_label ||
            ' was confirmed as a duplicate and linked to ' ||
            canonical_label || ' — "' ||
            COALESCE(canonical_title, 'Existing complaint') ||
            '". You will now receive updates for ' || canonical_label || '.',
        '/(resident)/complaints/' || NEW.matched_comp_id::TEXT,
        JSONB_BUILD_OBJECT(
            'duplicate_id', NEW.dup_id,
            'candidate_complaint_id', NEW.comp_id,
            'candidate_complaint_label', candidate_label,
            'canonical_complaint_id', NEW.matched_comp_id,
            'canonical_complaint_label', canonical_label
        ),
        'normal'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_duplicate_confirmed ON duplicate;
CREATE TRIGGER trg_notify_duplicate_confirmed
AFTER UPDATE OF admin_status ON duplicate
FOR EACH ROW
EXECUTE FUNCTION notify_resident_duplicate_confirmed();

CREATE OR REPLACE FUNCTION notify_complaint_audience_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    recipient RECORD;
    complaint_label TEXT;
BEGIN
    IF OLD.status::TEXT = NEW.status::TEXT THEN
        RETURN NEW;
    END IF;

    complaint_label := notification_complaint_label(NEW.comp_id);

    IF OLD.status::TEXT = 'unverified' AND NEW.status::TEXT = 'pending' THEN
        PERFORM enqueue_notification(
            NEW.acc_id,
            NULL,
            'complaint_accepted',
            'complaint',
            NEW.comp_id,
            'complaint:' || NEW.comp_id::TEXT || ':accepted:resident',
            'Complaint accepted',
            complaint_label || ' — "' || NEW.title ||
                '" was accepted as a complaint and is now awaiting action from the Community Authority.',
            '/(resident)/complaints/' || NEW.comp_id::TEXT,
            JSONB_BUILD_OBJECT(
                'complaint_id', NEW.comp_id,
                'complaint_label', complaint_label
            ),
            'normal'
        );

        FOR recipient IN
            SELECT acc_id
            FROM account
            WHERE role::TEXT = 'authority'
              AND status::TEXT = 'verified'
        LOOP
            PERFORM enqueue_notification(
                recipient.acc_id,
                NULL,
                'complaint_accepted',
                'complaint',
                NEW.comp_id,
                'complaint:' || NEW.comp_id::TEXT || ':accepted:authority',
                'New complaint ready for action',
                complaint_label || ' — "' || NEW.title ||
                    '" was accepted and is ready for authority processing.',
                '/authority/complaints/' || NEW.comp_id::TEXT,
                JSONB_BUILD_OBJECT(
                    'complaint_id', NEW.comp_id,
                    'complaint_label', complaint_label
                ),
                'normal'
            );
        END LOOP;
    END IF;

    IF OLD.status::TEXT = 'pending' AND NEW.status::TEXT = 'in progress' THEN
        FOR recipient IN
            SELECT DISTINCT audience.acc_id
            FROM (
                SELECT NEW.acc_id AS acc_id
                UNION ALL
                SELECT d.acc_id
                FROM duplicate AS d
                WHERE d.matched_comp_id = NEW.comp_id
                  AND d.admin_status::TEXT = 'confirmed'
            ) AS audience
            WHERE audience.acc_id IS NOT NULL
        LOOP
            PERFORM enqueue_notification(
                recipient.acc_id,
                NULL,
                'complaint_work_started',
                'complaint',
                NEW.comp_id,
                'complaint:' || NEW.comp_id::TEXT || ':work-started',
                'Work has started',
                'Work has started on ' || complaint_label || ' — "' ||
                    NEW.title || '". Follow the complaint for future progress updates.',
                '/(resident)/complaints/' || NEW.comp_id::TEXT,
                JSONB_BUILD_OBJECT(
                    'complaint_id', NEW.comp_id,
                    'complaint_label', complaint_label
                ),
                'normal'
            );
        END LOOP;
    END IF;

    IF OLD.status::TEXT = 'in progress' AND NEW.status::TEXT = 'resolved' THEN
        FOR recipient IN
            SELECT
                resident.acc_id,
                CASE
                    WHEN resident.acc_id = NEW.acc_id
                      OR EXISTS (
                          SELECT 1
                          FROM duplicate AS d
                          WHERE d.matched_comp_id = NEW.comp_id
                            AND d.acc_id = resident.acc_id
                            AND d.admin_status::TEXT = 'confirmed'
                      )
                    THEN 'normal'::notification_priority
                    ELSE 'low'::notification_priority
                END AS resident_priority
            FROM account AS resident
            WHERE resident.role::TEXT = 'resident'
              AND resident.status::TEXT = 'verified'
        LOOP
            PERFORM enqueue_notification(
                recipient.acc_id,
                NULL,
                'complaint_resolved',
                'complaint',
                NEW.comp_id,
                'complaint:' || NEW.comp_id::TEXT || ':resolved',
                'Community complaint resolved',
                complaint_label || ' — "' || NEW.title ||
                    '" has been resolved. You may view the result and leave feedback or a rating.',
                '/(resident)/complaints/' || NEW.comp_id::TEXT,
                JSONB_BUILD_OBJECT(
                    'complaint_id', NEW.comp_id,
                    'complaint_label', complaint_label,
                    'feedback_invited', TRUE
                ),
                recipient.resident_priority
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_complaint_status_change ON complaints;
CREATE TRIGGER trg_notify_complaint_status_change
AFTER UPDATE OF status ON complaints
FOR EACH ROW
EXECUTE FUNCTION notify_complaint_audience_status_change();

CREATE OR REPLACE FUNCTION notify_residents_about_work_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    complaint_row RECORD;
    recipient_id UUID;
    complaint_label TEXT;
    notification_kind notification_type;
    notification_title TEXT;
    notification_body TEXT;
BEGIN
    IF NEW.update_type::TEXT NOT IN ('progress_update', 'budget_deadline_change') THEN
        RETURN NEW;
    END IF;

    SELECT comp_id, title
    INTO complaint_row
    FROM complaints
    WHERE comp_id = NEW.comp_id
      AND status::TEXT = 'in progress';

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    complaint_label := notification_complaint_label(NEW.comp_id);

    IF NEW.update_type::TEXT = 'progress_update' THEN
        notification_kind := 'complaint_progress_updated';
        notification_title := 'Complaint progress updated';
        notification_body := complaint_label ||
            CASE
                WHEN NEW.progress_percent IS NOT NULL
                    THEN ' is now ' || NEW.progress_percent::TEXT || '% complete.'
                ELSE ' received a new progress update.'
            END ||
            CASE
                WHEN NULLIF(TRIM(COALESCE(NEW.note, '')), '') IS NOT NULL
                    THEN ' ' || TRIM(NEW.note)
                ELSE ''
            END;
    ELSE
        IF NEW.deadline IS NULL THEN
            RETURN NEW;
        END IF;

        notification_kind := 'complaint_deadline_changed';
        notification_title := 'Completion date updated';
        notification_body := 'The expected completion date for ' ||
            complaint_label || ' has been changed to ' ||
            TO_CHAR(NEW.deadline AT TIME ZONE 'Asia/Dhaka', 'DD Mon YYYY') || '.';
    END IF;

    FOR recipient_id IN
        SELECT DISTINCT audience.acc_id
        FROM (
            SELECT owner.acc_id
            FROM complaints AS owner
            WHERE owner.comp_id = NEW.comp_id
            UNION ALL
            SELECT d.acc_id
            FROM duplicate AS d
            WHERE d.matched_comp_id = NEW.comp_id
              AND d.admin_status::TEXT = 'confirmed'
        ) AS audience
        WHERE audience.acc_id IS NOT NULL
    LOOP
        PERFORM enqueue_notification(
            recipient_id,
            NEW.updated_by_acc_id,
            notification_kind,
            'complaint',
            NEW.comp_id,
            'complaint:' || NEW.comp_id::TEXT || ':work-update:' || NEW.update_id::TEXT,
            notification_title,
            notification_body,
            '/(resident)/complaints/' || NEW.comp_id::TEXT,
            JSONB_BUILD_OBJECT(
                'complaint_id', NEW.comp_id,
                'complaint_label', complaint_label,
                'work_update_id', NEW.update_id,
                'progress_percent', NEW.progress_percent,
                'deadline', NEW.deadline
            ),
            'normal'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_residents_work_update ON complaint_work_updates;
CREATE TRIGGER trg_notify_residents_work_update
AFTER INSERT ON complaint_work_updates
FOR EACH ROW
EXECUTE FUNCTION notify_residents_about_work_update();

CREATE OR REPLACE FUNCTION notify_authority_about_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    authority_id UUID;
    complaint_row RECORD;
    complaint_label TEXT;
BEGIN
    SELECT comp_id, title
    INTO complaint_row
    FROM complaints
    WHERE comp_id = NEW.comp_id;

    complaint_label := notification_complaint_label(NEW.comp_id);

    FOR authority_id IN
        SELECT acc_id
        FROM account
        WHERE role::TEXT = 'authority'
          AND status::TEXT = 'verified'
    LOOP
        PERFORM enqueue_notification(
            authority_id,
            NEW.acc_id,
            'complaint_feedback_received',
            'feedback',
            NEW.feedback_id,
            'feedback:' || NEW.feedback_id::TEXT || ':received',
            'New complaint feedback',
            'A resident submitted a ' || NEW.rating::TEXT ||
                '-star rating for ' || complaint_label || ' — "' ||
                COALESCE(complaint_row.title, 'Resolved complaint') || '".',
            '/authority/feedback-center',
            JSONB_BUILD_OBJECT(
                'feedback_id', NEW.feedback_id,
                'complaint_id', NEW.comp_id,
                'complaint_label', complaint_label,
                'rating', NEW.rating
            ),
            'normal'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_authority_feedback ON complaint_feedback;
CREATE TRIGGER trg_notify_authority_feedback
AFTER INSERT ON complaint_feedback
FOR EACH ROW
EXECUTE FUNCTION notify_authority_about_feedback();

CREATE OR REPLACE FUNCTION notify_resident_about_feedback_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    feedback_row RECORD;
    complaint_label TEXT;
BEGIN
    SELECT feedback.acc_id, feedback.comp_id
    INTO feedback_row
    FROM complaint_feedback AS feedback
    WHERE feedback.feedback_id = NEW.feedback_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    complaint_label := notification_complaint_label(feedback_row.comp_id);

    PERFORM enqueue_notification(
        feedback_row.acc_id,
        NEW.acc_id,
        'complaint_feedback_replied',
        'feedback',
        NEW.feedback_id,
        'feedback:' || NEW.feedback_id::TEXT || ':reply:' || NEW.reply_id::TEXT,
        'Authority replied to your feedback',
        'The Community Authority replied to your feedback for ' ||
            complaint_label || '.',
        '/(resident)/complaints/' || feedback_row.comp_id::TEXT,
        JSONB_BUILD_OBJECT(
            'feedback_id', NEW.feedback_id,
            'feedback_reply_id', NEW.reply_id,
            'complaint_id', feedback_row.comp_id,
            'complaint_label', complaint_label
        ),
        'normal'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_resident_feedback_reply ON feedback_replies;
CREATE TRIGGER trg_notify_resident_feedback_reply
AFTER INSERT ON feedback_replies
FOR EACH ROW
EXECUTE FUNCTION notify_resident_about_feedback_reply();

CREATE OR REPLACE FUNCTION notify_about_forum_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    recipient_id UUID;
    recipient_role account_role;
    post_title TEXT;
    event_type notification_type;
    event_title TEXT;
BEGIN
    SELECT title
    INTO post_title
    FROM forum_posts
    WHERE post_id = NEW.post_id;

    IF NEW.parent_comment_id IS NOT NULL THEN
        SELECT comment.acc_id
        INTO recipient_id
        FROM forum_comments AS comment
        WHERE comment.comment_id = NEW.parent_comment_id;

        event_type := 'forum_reply_received';
        event_title := 'New forum reply';
    ELSE
        SELECT post.acc_id
        INTO recipient_id
        FROM forum_posts AS post
        WHERE post.post_id = NEW.post_id;

        event_type := 'forum_comment_received';
        event_title := 'New forum comment';
    END IF;

    IF recipient_id IS NULL OR recipient_id = NEW.acc_id THEN
        RETURN NEW;
    END IF;

    SELECT role
    INTO recipient_role
    FROM account
    WHERE acc_id = recipient_id;

    PERFORM enqueue_notification(
        recipient_id,
        NEW.acc_id,
        event_type,
        'forum_comment',
        NEW.comment_id,
        'forum-comment:' || NEW.comment_id::TEXT || ':recipient:' ||
            recipient_id::TEXT,
        event_title,
        CASE
            WHEN NEW.parent_comment_id IS NULL
                THEN 'Someone commented on your forum post "' ||
                    COALESCE(post_title, 'Community discussion') || '".'
            ELSE 'Someone replied to your comment on "' ||
                COALESCE(post_title, 'Community discussion') || '".'
        END,
        notification_forum_path(recipient_role),
        JSONB_BUILD_OBJECT(
            'forum_post_id', NEW.post_id,
            'forum_comment_id', NEW.comment_id,
            'parent_comment_id', NEW.parent_comment_id
        ),
        'normal'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_forum_comment ON forum_comments;
CREATE TRIGGER trg_notify_forum_comment
AFTER INSERT ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION notify_about_forum_comment();

CREATE OR REPLACE FUNCTION notify_about_official_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    recipient RECORD;
BEGIN
    IF NOT NEW.is_official
       OR NEW.status::TEXT NOT IN ('Announcement', 'Update', 'Alert') THEN
        RETURN NEW;
    END IF;

    FOR recipient IN
        SELECT acc_id, role
        FROM account
        WHERE status::TEXT = 'verified'
          AND acc_id <> NEW.acc_id
    LOOP
        PERFORM enqueue_notification(
            recipient.acc_id,
            NEW.acc_id,
            'official_announcement',
            'forum_post',
            NEW.post_id,
            'forum-post:' || NEW.post_id::TEXT || ':official-post',
            CASE
                WHEN NEW.status::TEXT = 'Alert'
                    THEN 'Important community alert'
                WHEN NEW.status::TEXT = 'Update'
                    THEN 'New community update'
                ELSE 'Community announcement'
            END,
            NEW.title,
            notification_forum_path(recipient.role),
            JSONB_BUILD_OBJECT(
                'forum_post_id', NEW.post_id,
                'forum_post_type', NEW.status::TEXT
            ),
            CASE
                WHEN NEW.status::TEXT = 'Alert'
                    THEN 'high'::notification_priority
                ELSE 'normal'::notification_priority
            END
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_official_announcement ON forum_posts;
CREATE TRIGGER trg_notify_official_announcement
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION notify_about_official_announcement();

COMMENT ON FUNCTION enqueue_notification(
    UUID,
    UUID,
    notification_type,
    notification_entity_type,
    UUID,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    JSONB,
    notification_priority
) IS
    'Creates one deduplicated notification per recipient and suppresses self-notifications.';

COMMENT ON FUNCTION notify_complaint_audience_status_change() IS
    'Notifies owners for work start, all residents for resolution, and authority after complaint acceptance.';
