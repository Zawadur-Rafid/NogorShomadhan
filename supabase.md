# Supabase Database Schema

*This file tracks the current state of the database tables in the Supabase project. It must be updated whenever any schema changes are made.*

## Types

- `account_status`: ENUM ('unverified', 'verified', 'suspended')
- `account_role`: ENUM ('resident', 'admin', 'authority')
- `complaint_status`: ENUM ('unverified', 'pending', 'in progress', 'resolved')
- `complaint_category`: ENUM ('Road Damage', 'Garbage & Waste', 'Drainage & Waterlogging', 'Streetlight & Electrical', 'Water Supply', 'Sanitation & Public Toilets', 'Traffic & Illegal Parking', 'Public Safety & Encroachment', 'Noise & Environmental Pollution', 'Parks & Public Spaces', 'Animal-Related Issues', 'Other')
- `forum_post_type`: ENUM ('Announcement', 'Update', 'Alert')
- `notification_type`: ENUM ('account_review_required', 'account_approved', 'account_rejected', 'complaint_review_required', 'duplicate_review_required', 'complaint_accepted', 'complaint_rejected', 'complaint_duplicate_confirmed', 'complaint_work_started', 'complaint_pending_stale', 'complaint_progress_updated', 'complaint_deadline_changed', 'complaint_deadline_milestone', 'complaint_overdue', 'complaint_resolved', 'complaint_feedback_received', 'complaint_feedback_replied', 'forum_comment_received', 'forum_reply_received', 'official_announcement', 'system_alert')
- `notification_entity_type`: ENUM ('account', 'complaint', 'feedback', 'forum_post', 'forum_comment', 'system')
- `notification_priority`: ENUM ('low', 'normal', 'high', 'urgent')
- `duplicate_review_status`: ENUM ('pending', 'confirmed', 'rejected')

## Tables

### `account`
- `acc_id`: UUID (Primary Key, Default: gen_random_uuid())
- `full_name`: VARCHAR(255) (NOT NULL)
- `nid`: VARCHAR(17) (NOT NULL, CHECK: digits only)
- `email`: VARCHAR(255) (UNIQUE, NOT NULL)
- `phone_num`: VARCHAR(11) (NOT NULL, CHECK: exactly 11 digits)
- `house_num`: VARCHAR(100)
- `road_number`: VARCHAR(100)
- `avenue_num`: VARCHAR(100)
- `username`: VARCHAR(100) (UNIQUE, NOT NULL)
- `password`: VARCHAR(255) (NOT NULL)
- `status`: account_status (Default: 'unverified', NOT NULL)
- `role`: account_role (Default: 'resident', NOT NULL)

### `complaints`
- `comp_id`: UUID (Primary Key, Default: gen_random_uuid())
- `acc_id`: UUID (Foreign Key to account.acc_id)
- `title`: TEXT (NOT NULL)
- `description`: TEXT (NOT NULL)
- `house`: TEXT
- `road`: TEXT
- `avenue`: TEXT
- `nearby_landmark`: TEXT
- `additional_location_details`: TEXT
- `category`: complaint_category (NOT NULL)
- `status`: complaint_status (Default: 'unverified', NOT NULL)
- `timestamp`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP)

### `evidence`
- `ev_id`: UUID (Primary Key, Default: gen_random_uuid())
- `comp_id`: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- `img_url`: TEXT (NOT NULL)

### `duplicate`
- `dup_id`: UUID (Primary Key, Default: gen_random_uuid())
- `acc_id`: UUID (Foreign Key to account.acc_id)
- `comp_id`: UUID (Nullable Foreign Key to complaints.comp_id, ON DELETE SET NULL; newly submitted candidate complaint)
- `timestamp`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP)
- `matched_comp_id`: UUID (Foreign Key to complaints.comp_id, NOT NULL; canonical/original complaint)
- `ai_score`: NUMERIC
- `ai_reason`: TEXT
- `admin_status`: duplicate_review_status (Default: 'pending')
- `reviewed_at`: TIMESTAMPTZ
- `admin_note`: TEXT

Notification integration assumptions:
- `comp_id` identifies the newly submitted candidate complaint and becomes null if that complaint is deleted.
- `matched_comp_id` identifies the canonical complaint that remains active.
- `acc_id` identifies the resident who submitted the candidate complaint.
- Admin review should set `admin_status` to `confirmed` before deleting the candidate complaint so the confirmation notification can include both complaint references.
- Notification triggers observe duplicate inserts and `admin_status` changes; they do not decide the duplicate status or delete complaint/duplicate records.

### complaint_status_history
- history_id: UUID (Primary Key, Default: gen_random_uuid())
- comp_id: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- from_status: complaint_status (NOT NULL)
- to_status: complaint_status (NOT NULL)
- changed_by_acc_id: UUID (Foreign Key to account.acc_id, NOT NULL)
- changed_at: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)
- note: TEXT (NULL)

Purpose:
- Audit trail for transitions such as unverified -> pending -> in progress -> resolved

### complaint_work_updates
- update_id: UUID (Primary Key, Default: gen_random_uuid())
- comp_id: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- updated_by_acc_id: UUID (Foreign Key to account.acc_id, NOT NULL)
- update_type: work_update_type (NOT NULL)
- note: TEXT (NULL)
- budget: NUMERIC(12,2) (NULL)
- deadline: TIMESTAMPTZ (NULL)
- progress_percent: INTEGER (NULL, CHECK between 0 and 100)
- created_at: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Timeline of authority updates on in progress complaints

### contractor_history
- contractor_event_id: UUID (Primary Key, Default: gen_random_uuid())
- comp_id: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- contractor_name: TEXT (NOT NULL)
- contractor_phone: TEXT (NOT NULL)
- change_reason: TEXT (NULL)
- changed_by_acc_id: UUID (Foreign Key to account.acc_id, NOT NULL)
- changed_at: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)
- is_current: BOOLEAN (Default: true, NOT NULL)

Purpose:
- Full contractor change history with reason and actor

### complaint_update_evidence
- update_evidence_id: UUID (Primary Key, Default: gen_random_uuid())
- update_id: UUID (Foreign Key to complaint_work_updates.update_id, ON DELETE CASCADE, NOT NULL)
- comp_id: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- img_url: TEXT (NOT NULL)
- storage_path: TEXT (NULL)
- uploaded_by_acc_id: UUID (Foreign Key to account.acc_id, NOT NULL)
- uploaded_at: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Evidence images for authority progress and completion updates

### complaint_resolution
- comp_id: UUID (Primary Key, Foreign Key to complaints.comp_id, ON DELETE CASCADE)
- resolved_by_acc_id: UUID (Foreign Key to account.acc_id, NOT NULL)
- resolved_at: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)
- resolution_note: TEXT (NULL)
- final_budget: NUMERIC(12,2) (NULL)
- final_deadline: TIMESTAMPTZ (NULL)

### `forum_posts`
- `post_id`: UUID (Primary Key, Default: gen_random_uuid())
- `acc_id`: UUID (Foreign Key to account.acc_id, ON DELETE CASCADE, NOT NULL)
- `title`: TEXT (NOT NULL)
- `body`: TEXT (NOT NULL)
- `status`: forum_post_type (Default: 'Update', NOT NULL)
- `is_official`: BOOLEAN (Default: false, NOT NULL)
- `created_at`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Stores forum posts, announcements, updates, and community alerts across all stakeholders.

### `forum_comments`
- `comment_id`: UUID (Primary Key, Default: gen_random_uuid())
- `post_id`: UUID (Foreign Key to forum_posts.post_id, ON DELETE CASCADE, NOT NULL)
- `acc_id`: UUID (Foreign Key to account.acc_id, ON DELETE CASCADE, NOT NULL - secondary key linking the resident/user)
- `parent_comment_id`: UUID (Foreign Key to forum_comments.comment_id, ON DELETE CASCADE, NULL)
- `content`: TEXT (NOT NULL)
- `is_official`: BOOLEAN (Default: false, NOT NULL)
- `created_at`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Stores comments on forum posts and direct replies to specific comments. Supports admin moderation/deletion.

### `complaint_feedback`
- `feedback_id`: UUID (Primary Key, Default: gen_random_uuid())
- `comp_id`: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- `acc_id`: UUID (Foreign Key to account.acc_id, ON DELETE CASCADE, NOT NULL)
- `rating`: INTEGER (NOT NULL, CHECK: rating >= 1 AND rating <= 5)
- `comment`: TEXT (NOT NULL)
- `created_at`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Stores feedback comments and star ratings (1 to 5 stars) left by residents under resolved complaints.

### `feedback_replies`
- `reply_id`: UUID (Primary Key, Default: gen_random_uuid())
- `feedback_id`: UUID (Foreign Key to complaint_feedback.feedback_id, ON DELETE CASCADE, NOT NULL)
- `acc_id`: UUID (Foreign Key to account.acc_id, ON DELETE CASCADE, NOT NULL)
- `message`: TEXT (NOT NULL)
- `created_at`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Stores responses from community authority to resident feedback comments.

### `app_settings`
- `id`: INTEGER (Primary Key, CHECK: id = 1 — singleton row)
- `ai_auto_categorize`: BOOLEAN (Default: true, NOT NULL)
- `duplicate_detection`: BOOLEAN (Default: true, NOT NULL)
- `duplicate_threshold_percent`: INTEGER (Default: 85, NOT NULL, CHECK: IN (50, 70, 85))
- `duplicate_alerts`: BOOLEAN (Default: true, NOT NULL)
- `new_account_alerts`: BOOLEAN (Default: true, NOT NULL)
- `maintenance_mode`: BOOLEAN (Default: false, NOT NULL)
- `updated_by_acc_id`: UUID (Nullable Foreign Key to account.acc_id, ON DELETE SET NULL)
- `updated_at`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)

Purpose:
- Persists the admin System Settings page: AI categorization, duplicate detection, thresholds, notification toggles, and maintenance mode.
- Uses a single row (`id = 1`) as a configuration singleton.

### `notifications`
- `notification_id`: UUID (Primary Key, Default: gen_random_uuid())
- `recipient_acc_id`: UUID (Foreign Key to account.acc_id, ON DELETE CASCADE, NOT NULL)
- `actor_acc_id`: UUID (Foreign Key to account.acc_id, ON DELETE SET NULL)
- `type`: notification_type (NOT NULL)
- `entity_type`: notification_entity_type (NOT NULL)
- `entity_id`: UUID (Generic reference to the related account, complaint, feedback, forum post, or comment)
- `event_key`: TEXT (NOT NULL; unique per recipient for deduplication)
- `title`: TEXT (NOT NULL)
- `body`: TEXT (NOT NULL)
- `action_path`: TEXT (Nullable internal Expo Router path)
- `data`: JSONB (Default: empty object, NOT NULL)
- `priority`: notification_priority (Default: 'normal', NOT NULL)
- `created_at`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP, NOT NULL)
- `seen_at`: TIMESTAMPTZ (Nullable)
- `read_at`: TIMESTAMPTZ (Nullable)
- `push_sent_at`: TIMESTAMPTZ (Nullable)

Purpose:
- Stores one persistent notification per recipient across resident, admin, and authority roles.
- Prevents duplicate delivery with a unique `(recipient_acc_id, event_key)` constraint.
- Supports unread counts, read state, future push delivery, and role-aware deep links.

Security:
- Row Level Security is enabled with public select, insert, and update policies to match the current anonymous-client access model documented in `rls.md`.
- The app must filter reads and updates by `recipient_acc_id`; stronger recipient-scoped enforcement remains in the security-hardening backlog.
- No public delete policy is provided, so notification history is retained.

Scheduled generation:
- `notify-stale-pending-complaints` runs daily at 03:00 UTC (09:00 Asia/Dhaka).
- It creates one high-priority authority notification when a complaint remains `pending` for 14 days after acceptance.
- The acceptance time comes from the latest `unverified` to `pending` history row when available, with the persisted complaint-accepted notification as a fallback.
- The notification event key prevents the daily job from creating repeated reminders for the same complaint and authority account.


