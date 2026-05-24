alter table public.users
add column if not exists password_set_at timestamptz;
