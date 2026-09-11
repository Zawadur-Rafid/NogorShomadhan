-- Migration: add app_settings table
-- Description: Singleton row storing admin System Settings with RLS.
-- Apply via: supabase db push  (or run in the Supabase SQL Editor)

create table if not exists app_settings (
    id integer primary key check (id = 1),
    ai_auto_categorize boolean not null default true,
    duplicate_detection boolean not null default true,
    duplicate_threshold_percent integer not null default 85 check (duplicate_threshold_percent in (50, 70, 85)),
    duplicate_alerts boolean not null default true,
    new_account_alerts boolean not null default true,
    maintenance_mode boolean not null default false,
    updated_by_acc_id uuid references account(acc_id) on delete set null,
    updated_at timestamptz default current_timestamp not null
);

insert into app_settings (id) values (1)
on conflict (id) do nothing;

alter table app_settings enable row level security;

do $$ begin
    create policy "Enable select for public" on app_settings for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Enable update for public" on app_settings for update using (true);
exception when duplicate_object then null; end $$;