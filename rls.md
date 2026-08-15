# Supabase Row Level Security (RLS) Policies

*This file tracks the RLS conditions and policies for each table in the Supabase project. It must be updated whenever any RLS changes are made.*

### `account`
- **RLS Enabled:** Yes
- **Policies:**
  - `Enable insert for public`: Allows public (anonymous) users to `INSERT` records during registration.
