# Supabase Database Schema

*This file tracks the current state of the database tables in the Supabase project. It must be updated whenever any schema changes are made.*

## Types

- `account_status`: ENUM ('unverified', 'verified', 'suspended')
- `account_role`: ENUM ('resident', 'admin', 'authority')

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
