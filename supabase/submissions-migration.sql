create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text,
  due_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer_text text,
  file_url text,
  submitted_at timestamptz not null default now(),
  unique(assignment_id, user_id)
);

alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;

drop policy if exists "Enrolled users can view assignments" on public.assignments;
drop policy if exists "Admins can manage assignments" on public.assignments;
drop policy if exists "Users can read their submissions" on public.assignment_submissions;
drop policy if exists "Users can submit assignments" on public.assignment_submissions;
drop policy if exists "Users can update their submissions" on public.assignment_submissions;

create policy "Enrolled users can view assignments"
  on public.assignments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments
      where enrollments.course_id = assignments.course_id
        and enrollments.user_id = auth.uid()
        and enrollments.status = 'active'
    )
  );

create policy "Admins can manage assignments"
  on public.assignments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can read their submissions"
  on public.assignment_submissions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can submit assignments"
  on public.assignment_submissions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.assignments
      join public.enrollments on enrollments.course_id = assignments.course_id
      where assignments.id = assignment_submissions.assignment_id
        and enrollments.user_id = auth.uid()
        and enrollments.status = 'active'
    )
  );

create policy "Users can update their submissions"
  on public.assignment_submissions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
