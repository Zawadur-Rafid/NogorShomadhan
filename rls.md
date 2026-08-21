# Supabase Row Level Security (RLS) Policies

*This file tracks the RLS conditions and policies for each table in the Supabase project. It must be updated whenever any RLS changes are made.*

### `account`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public (anonymous) users to `INSERT` records during registration.
  - `Enable select for public`: Allows public users to `SELECT` (read) records from the account table (necessary for current frontend sign-in logic).
  - `Enable update for public`: Allows public users to `UPDATE` their own records in the account table (necessary for profile editing).

### `complaints`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public users to create complaints.
  - `Enable select for public`: Allows public users to view all complaints (necessary for map and feed).
  - `Enable update for public`: Allows public users to update complaints (e.g., status changes).

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
