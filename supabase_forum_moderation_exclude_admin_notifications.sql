-- Patch: do not notify admins about a resident forum post they already reviewed.
-- Run after supabase_forum_moderation_triggers.sql.

CREATE OR REPLACE FUNCTION notify_about_resident_discussion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    recipient RECORD;
    author_name TEXT;
BEGIN
    -- Official posts are handled by notify_about_official_announcement().
    IF NEW.is_official THEN
        RETURN NEW;
    END IF;

    IF NEW.moderation_status <> 'approved'
       OR OLD.moderation_status = 'approved' THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'A resident')
    INTO author_name
    FROM account
    WHERE acc_id = NEW.acc_id;

    FOR recipient IN
        SELECT acc_id, role
        FROM account
        WHERE status::TEXT = 'verified'
          AND role::TEXT <> 'admin'
          AND acc_id <> NEW.acc_id
    LOOP
        PERFORM enqueue_notification(
            recipient.acc_id,
            NEW.acc_id,
            'forum_discussion_created',
            'forum_post',
            NEW.post_id,
            'forum-post:' || NEW.post_id::TEXT || ':resident-discussion',
            'New resident discussion',
            COALESCE(author_name, 'A resident') || ' posted: "' || NEW.title || '"',
            notification_forum_path(recipient.role),
            JSONB_BUILD_OBJECT(
                'forum_post_id', NEW.post_id,
                'forum_post_type', NEW.status::TEXT,
                'is_official', FALSE
            ),
            'normal'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_about_resident_discussion() IS
    'Notifies the authority and other verified residents once an admin approves a resident discussion; admins are excluded because they already reviewed it.';
