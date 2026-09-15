-- Migration: Notification flow for the forum post verification workflow.
-- Prerequisites:
--   1. supabase_notifications.sql
--   2. supabase_notification_triggers.sql
--   3. supabase_forum_moderation.sql
--   4. supabase_forum_moderation_types.sql   (must already be committed)
--
-- Timeline this file implements:
--   resident submits  -> every admin is notified that a post needs review
--   admin approves    -> author is notified, then authority + all other
--                        residents are notified that the post is live
--   admin rejects     -> author is notified together with the reason
--
-- NOTE: this file redefines notify_about_resident_discussion() and its trigger,
-- which supabase_notification_triggers.sql installs as AFTER INSERT. If that
-- older file is ever re-run, run this one again afterwards.

-- 1. A resident submitted a post: tell every admin it is waiting for review.
CREATE OR REPLACE FUNCTION notify_admins_about_forum_post_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id UUID;
    author_name TEXT;
BEGIN
    IF NEW.moderation_status <> 'pending' THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'A resident')
    INTO author_name
    FROM account
    WHERE acc_id = NEW.acc_id;

    FOR admin_id IN
        SELECT acc_id
        FROM account
        WHERE role::TEXT = 'admin'
          AND status::TEXT = 'verified'
    LOOP
        PERFORM enqueue_notification(
            admin_id,
            NEW.acc_id,
            'forum_post_review_required',
            'forum_post',
            NEW.post_id,
            'forum-post:' || NEW.post_id::TEXT || ':review-required',
            'Forum post needs review',
            COALESCE(author_name, 'A resident') || ' submitted "' || NEW.title ||
                '" for review. Check it against the community guidelines.',
            '/(admin)/forum/review?postId=' || NEW.post_id::TEXT,
            JSONB_BUILD_OBJECT(
                'forum_post_id', NEW.post_id,
                'moderation_status', NEW.moderation_status::TEXT
            ),
            'high'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_forum_post_review ON forum_posts;
CREATE TRIGGER trg_notify_admins_forum_post_review
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admins_about_forum_post_review();

-- 2. An admin decided: tell the author, with the reason when rejected.
CREATE OR REPLACE FUNCTION notify_author_about_forum_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Fires on any decision, including a later reversal of an earlier one.
    IF NEW.moderation_status IS NOT DISTINCT FROM OLD.moderation_status
       OR NEW.moderation_status = 'pending' THEN
        RETURN NEW;
    END IF;

    -- The decision is made, so the admin queue entry is no longer actionable.
    DELETE FROM notifications
    WHERE entity_type = 'forum_post'
      AND entity_id = NEW.post_id
      AND type = 'forum_post_review_required'
      AND read_at IS NULL;

    IF NEW.moderation_status = 'approved' THEN
        PERFORM enqueue_notification(
            NEW.acc_id,
            NEW.reviewed_by,
            'forum_post_approved',
            'forum_post',
            NEW.post_id,
            'forum-post:' || NEW.post_id::TEXT || ':approved',
            'Your forum post is live',
            '"' || NEW.title || '" passed admin review and is now visible to the community.',
            '/(resident)/forum?postId=' || NEW.post_id::TEXT,
            JSONB_BUILD_OBJECT(
                'forum_post_id', NEW.post_id,
                'moderation_status', 'approved'
            ),
            'normal'
        );
    ELSE
        PERFORM enqueue_notification(
            NEW.acc_id,
            NEW.reviewed_by,
            'forum_post_rejected',
            'forum_post',
            NEW.post_id,
            'forum-post:' || NEW.post_id::TEXT || ':rejected',
            'Your forum post was not approved',
            '"' || NEW.title || '" was rejected by an admin. Reason: ' ||
                COALESCE(NULLIF(TRIM(NEW.rejection_note), ''), 'No reason was provided.'),
            '/(resident)/forum?postId=' || NEW.post_id::TEXT,
            JSONB_BUILD_OBJECT(
                'forum_post_id', NEW.post_id,
                'moderation_status', 'rejected',
                'rejection_note', NEW.rejection_note
            ),
            'high'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_author_forum_moderation ON forum_posts;
CREATE TRIGGER trg_notify_author_forum_moderation
AFTER UPDATE OF moderation_status ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION notify_author_about_forum_moderation();

-- 3. Announce an approved resident discussion to the rest of the community.
--    Replaces the AFTER INSERT version from supabase_notification_triggers.sql:
--    the community now hears about a post only once an admin has approved it.
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

DROP TRIGGER IF EXISTS trg_notify_resident_discussion ON forum_posts;
CREATE TRIGGER trg_notify_resident_discussion
AFTER UPDATE OF moderation_status ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION notify_about_resident_discussion();

-- 4. Official announcements still publish on insert, but only when approved.
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
       OR NEW.moderation_status <> 'approved'
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

COMMENT ON FUNCTION notify_admins_about_forum_post_review() IS
    'Notifies every verified admin when a resident submits a forum post for review.';
COMMENT ON FUNCTION notify_author_about_forum_moderation() IS
    'Notifies the author when an admin approves or rejects their post, including the rejection reason.';
COMMENT ON FUNCTION notify_about_resident_discussion() IS
    'Notifies the authority and other verified residents once an admin approves a resident discussion; admins are excluded because they already reviewed it.';
