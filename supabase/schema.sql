create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone_number text unique,
  full_name text,
  email text,
  school text,
  district text,
  guardian_phone text,
  is_admin boolean not null default false,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  otp_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_phone_created_idx
  on public.otp_codes(phone_number, created_at desc);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(10, 2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  youtube_url text not null,
  duration_seconds integer not null default 0,
  sequence_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  file_url text not null,
  sequence_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  bank_slip_url text not null,
  amount numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active')),
  enrolled_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.video_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  watched_percentage integer not null default 0,
  last_watched_at timestamptz not null default now(),
  primary key(user_id, video_id)
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  );
$$;

alter table public.users enable row level security;
alter table public.otp_codes enable row level security;
alter table public.courses enable row level security;
alter table public.videos enable row level security;
alter table public.course_materials enable row level security;
alter table public.payments enable row level security;
alter table public.enrollments enable row level security;
alter table public.video_progress enable row level security;

create policy "Users can read their own profile"
  on public.users for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Anyone can view courses"
  on public.courses for select
  using (true);

create policy "Admins can manage courses"
  on public.courses for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Enrolled users can view videos"
  on public.videos for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments
      where enrollments.course_id = videos.course_id
        and enrollments.user_id = auth.uid()
        and enrollments.status = 'active'
    )
  );

create policy "Admins can manage videos"
  on public.videos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Enrolled users can view materials"
  on public.course_materials for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments
      where enrollments.course_id = course_materials.course_id
        and enrollments.user_id = auth.uid()
        and enrollments.status = 'active'
    )
  );

create policy "Admins can manage materials"
  on public.course_materials for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can create payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Users and admins can read payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update payments"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can create enrollments"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

create policy "Users and admins can read enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update enrollments"
  on public.enrollments for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can manage their progress"
  on public.video_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
