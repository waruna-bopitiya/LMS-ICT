-- Migration to create papers table, student_marks table, and student_marks_with_ranks view

-- 1. Create the papers table
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  total_marks numeric not null check (total_marks > 0),
  created_at timestamptz not null default now()
);

-- 2. Create or recreate the student_marks table referencing papers
drop table if exists public.student_marks cascade;

create table public.student_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  paper_id uuid not null references public.papers(id) on delete cascade,
  marks_obtained numeric not null check (marks_obtained >= 0),
  percentage numeric not null check (percentage >= 0 and percentage <= 100),
  created_at timestamptz not null default now(),
  
  -- Prevent duplicate entries for the same student and paper
  constraint student_marks_user_id_paper_id_key unique (user_id, paper_id)
);

-- Index for fast query access
create index if not exists student_marks_user_id_idx on public.student_marks(user_id);
create index if not exists student_marks_paper_id_idx on public.student_marks(paper_id);

-- Enable Row Level Security (RLS)
alter table public.papers enable row level security;
alter table public.student_marks enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow select for authenticated users on papers" on public.papers;
drop policy if exists "Allow select for own marks on student_marks" on public.student_marks;

-- Create SELECT policies
create policy "Allow select for authenticated users on papers" 
  on public.papers for select to authenticated using (true);

create policy "Allow select for own marks on student_marks" 
  on public.student_marks for select to authenticated using (auth.uid() = user_id);

-- 3. Create view with dynamic ranks and class average calculation
create or replace view public.student_marks_with_ranks as
select 
  sm.id,
  sm.user_id,
  u.student_id,
  u.full_name,
  p.id as paper_id,
  p.name as paper_name,
  sm.marks_obtained,
  p.total_marks,
  sm.percentage,
  rank() over (partition by sm.paper_id order by sm.percentage desc) as rank,
  count(*) over (partition by sm.paper_id) as total_participants,
  round(avg(sm.percentage) over (partition by sm.paper_id), 2) as class_average,
  sm.created_at
from public.student_marks sm
join public.users u on sm.user_id = u.id
join public.papers p on sm.paper_id = p.id;
