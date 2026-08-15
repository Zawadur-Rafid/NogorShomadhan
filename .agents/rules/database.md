# Database Schema and RLS Rules

Whenever you make any changes to the database schema (adding, modifying, or deleting tables) or change the Row Level Security (RLS) policies for any table in the Supabase project, you **MUST** update the following two files in the root of the workspace:

1. `supabase.md`: Keep the current state of all database tables updated here.
2. `rls.md`: Keep the RLS conditions and policies for each table updated here.

Always check and update these files to ensure they perfectly mirror the actual state of the database.
