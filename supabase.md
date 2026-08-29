# Supabase Database Schema

*This file tracks the current state of the database tables in the Supabase project. It must be updated whenever any schema changes are made.*

## Types

- `account_status`: ENUM ('unverified', 'verified', 'suspended')
- `account_role`: ENUM ('resident', 'admin', 'authority')
- `complaint_status`: ENUM ('unverified', 'pending', 'in progress', 'resolved')
- `complaint_category`: ENUM ('Road Damage', 'Garbage & Waste', 'Drainage & Waterlogging', 'Streetlight & Electrical', 'Water Supply', 'Sanitation & Public Toilets', 'Traffic & Illegal Parking', 'Public Safety & Encroachment', 'Noise & Environmental Pollution', 'Parks & Public Spaces', 'Animal-Related Issues', 'Other')
- `forum_post_type`: ENUM ('Announcement', 'Update', 'Alert')

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
- `comp_id`: UUID (Foreign Key to complaints.comp_id)
- `timestamp`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP)

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

