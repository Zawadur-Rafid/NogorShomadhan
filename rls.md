# Supabase Row Level Security (RLS) Policies

*This file tracks the RLS conditions and policies for each table in the Supabase project. It must be updated whenever any RLS changes are made.*

### `account`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public (anonymous) users to `INSERT` records during registration.
  - `Enable select for public`: Allows public users to `SELECT` (read) records from the account table (necessary for current frontend sign-in logic).
  - `Enable update for public`: Allows public users to `UPDATE` their own records in the account table (necessary for profile editing).
  - `Enable delete for public`: Allows public users to `DELETE` records from the account table (necessary for admin rejecting and deleting accounts).

### `complaints`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public users to create complaints.
  - `Enable select for public`: Allows public users to view all complaints (necessary for feed).
  - `Enable update for public`: Allows public users to update complaints (e.g., status changes).
  - `Enable delete for public unverified`: Allows public users to delete unverified complaints.

### `evidence`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public users to add evidence images.
  - `Enable select for public`: Allows public users to view evidence images.
  - `Enable delete for public`: Allows public users to delete evidence images.

### `duplicate`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public users to flag duplicates.
  - `Enable select for public`: Allows public users to view duplicate records.

### complaint_status_history
- RLS Enabled: Yes
- Policies:
  - Enable insert for public: Insert transition audit rows.
  - Enable select for public: Read complaint timeline.
- Expected app behavior:
  - Every complaints.status change inserts one history row.

### complaint_work_updates
- RLS Enabled: Yes
- Policies:
  - Enable insert for public: Authority workflow updates.
  - Enable select for public: Timeline display.
  - Enable update for public: Edit updates if needed.

### contractor_history
- RLS Enabled: Yes
- Policies:
  - Enable insert for public: Add new contractor change event.
  - Enable select for public: View contractor history.
  - Enable update for public: Mark previous is_current false and latest true.

### complaint_update_evidence
- RLS Enabled: Yes
- Policies:
  - Enable insert for public: Upload authority update images.
  - Enable select for public: Show update images.
  - Enable delete for public: Remove incorrect uploads if required.

### `complaint_resolution`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Create completion snapshot.
  - `Enable select for public`: Read completion information.
  - `Enable update for public`: Correct final note or budget if needed.

### `forum_posts`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable select for public`: Allows all users (residents, authority, admin) to read forum posts and announcements.
  - `Enable insert for public`: Allows users to publish discussions and admin announcements.
  - `Enable update for public`: Allows post updates.
  - `Enable delete for public`: Allows post deletion by authorized users/admin.

### `forum_comments`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable select for public`: Allows all users to view comments and replies on forum posts.
  - `Enable insert for public`: Allows residents, authority, and admin to post comments and reply to specific comments.
  - `Enable update for public`: Allows comment edits.
  - `Enable delete for public`: Allows comment deletion (enables admin deletion of comments from the main table).

### `complaint_feedback`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable select for public`: Allows all users to read feedback comments and star ratings for resolved complaints.
  - `Enable insert for public`: Allows residents to submit feedback comments and star ratings under resolved complaints.
  - `Enable update for public`: Allows updating feedback comments or ratings.
  - `Enable delete for public`: Allows deleting feedback.

### `feedback_replies`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable select for public`: Allows all users to read authority replies to feedback comments.
  - `Enable insert for public`: Allows community authorities to reply to resident feedback comments.
  - `Enable update for public`: Allows editing feedback replies.
  - `Enable delete for public`: Allows deleting feedback replies.

### `app_settings`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable select for public`: Allows all users to read the singleton settings row.
  - `Enable update for public`: Allows the app to update settings toggles and the maintenance mode.
- **No delete or insert policy:** The singleton row is seeded by the migration, so clients never insert or delete it.

### `notifications`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable select for public`: Allows the app to read notifications and filter them by the locally stored recipient account ID.
  - `Enable insert for public`: Allows notification records to be generated under the project's current anonymous-client access model.
  - `Enable update for public`: Allows the app to update `seen_at` and `read_at` when notifications are viewed or marked as read.
- **No delete policy:** Notification history is retained instead of being removed by clients.
- **Expected app behavior:**
  - Every notification query filters by `recipient_acc_id`.
  - Clients update read-state timestamps but do not delete notification rows.
  - `event_key` prevents the same event from being inserted twice for one recipient.

Security hardening backlog:
1. Migrate to Supabase Auth and map auth user to account.acc_id.
2. Replace public policies with role-based policies for resident, admin, and authority.
3. Restrict complaint status updates to valid transitions only.

