# Supabase Database Schema

*This file tracks the current state of the database tables in the Supabase project. It must be updated whenever any schema changes are made.*

## Types

- `account_status`: ENUM ('unverified', 'verified', 'suspended')
- `account_role`: ENUM ('resident', 'admin', 'authority')
- `complaint_status`: ENUM ('unverified', 'pending', 'in progress', 'resolved')
- `complaint_category`: ENUM ('Road Damage', 'Garbage & Waste', 'Drainage & Waterlogging', 'Streetlight & Electrical', 'Water Supply', 'Sanitation & Public Toilets', 'Traffic & Illegal Parking', 'Public Safety & Encroachment', 'Noise & Environmental Pollution', 'Parks & Public Spaces', 'Animal-Related Issues', 'Other')

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
- `longitude`: DOUBLE PRECISION (NOT NULL)
- `latitude`: DOUBLE PRECISION (NOT NULL)
- `category`: complaint_category (NOT NULL)
- `status`: complaint_status (Default: 'unverified', NOT NULL)
- `timestamp`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP)
- `urgency`: INTEGER (Default: 0, NOT NULL)

### `evidence`
- `ev_id`: UUID (Primary Key, Default: gen_random_uuid())
- `comp_id`: UUID (Foreign Key to complaints.comp_id, ON DELETE CASCADE, NOT NULL)
- `img_url`: TEXT (NOT NULL)

### `duplicate`
- `dup_id`: UUID (Primary Key, Default: gen_random_uuid())
- `acc_id`: UUID (Foreign Key to account.acc_id)
- `comp_id`: UUID (Foreign Key to complaints.comp_id)
- `timestamp`: TIMESTAMPTZ (Default: CURRENT_TIMESTAMP)
