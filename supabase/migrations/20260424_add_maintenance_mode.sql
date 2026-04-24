-- Table for global system settings
create table if not exists public.system_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Initialize maintenance_mode to false
insert into public.system_settings (key, value)
values ('maintenance_mode', 'false'::jsonb)
on conflict (key) do nothing;

-- Enable RLS
alter table public.system_settings enable row level security;

-- Everyone can read the settings (needed for check at login/app load)
create policy "Anyone can read system settings"
on public.system_settings for select
using (true);

-- Only admins can modify settings
create policy "Only admins can modify system settings"
on public.system_settings for all
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
);
