-- Lets admins hide a class from students without deleting it.
-- Existing classes stay visible.
alter table public.courses
  add column if not exists is_published boolean not null default true;

-- Students and visitors only see published classes; admins see all.
drop policy if exists "Anyone can view courses" on public.courses;
create policy "Anyone can view courses"
  on public.courses for select
  using (is_published or public.is_admin());
