-- Patch: point the admin review notification at the screen that actually exists.
-- Run after supabase_forum_moderation_triggers.sql.
--
-- The first version linked to '/(admin)/forum/review', which is not a route in
-- the app. Admins open the forum screen itself, which already scrolls to and
-- highlights the post named by ?postId=.

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
            '/(admin)/forum?postId=' || NEW.post_id::TEXT,
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

-- Repoint notifications that were already created with the broken path.
UPDATE notifications
SET action_path = '/(admin)/forum?postId=' || entity_id::TEXT
WHERE type = 'forum_post_review_required'
  AND action_path LIKE '/(admin)/forum/review%'
  AND entity_id IS NOT NULL;
