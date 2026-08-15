-- Security hardening migration
-- Addresses SEC-01, SEC-02, SEC-03, SEC-04, SEC-06, SEC-08, SEC-20 from the 2026-08-15 audit.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- SEC-01  Privilege escalation: any student could set users.is_admin = true
--
-- The row policy already restricts *which* row a user may update, but Postgres
-- RLS cannot restrict *which columns*. Column-level grants do that job, so the
-- two work together: the grant decides what may be written, the policy decides
-- on whose row.
-- ---------------------------------------------------------------------------

revoke update on public.users from authenticated;

grant update (full_name, email, school, district, guardian_phone)
  on public.users to authenticated;

-- Second gate: even a future policy or grant mistake cannot flip is_admin or
-- reassign student_id from a normal session. Only the service role may.
create or replace function public.guard_users_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- PostgREST does SET LOCAL ROLE from the JWT, so current_user is the caller's
  -- real role: 'authenticated' for a signed-in student, 'service_role' for our
  -- server routes, 'postgres' for the SQL editor.
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'is_admin cannot be modified by this role';
    end if;
    if new.student_id is distinct from old.student_id then
      raise exception 'student_id cannot be modified by this role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_users_privileged_columns on public.users;
create trigger guard_users_privileged_columns
  before update on public.users
  for each row execute function public.guard_users_privileged_columns();

-- ---------------------------------------------------------------------------
-- SEC-02  Payment bypass: students could insert enrollments with status
--         'active' and unlock every paid course for free.
--
-- A column default is not a constraint. Pin the value in the policy.
-- Activation happens only via the PayHere callback, admin approval, or manual
-- enrolment, all of which hold the service role and bypass this policy.
-- ---------------------------------------------------------------------------

drop policy if exists "Users can create enrollments" on public.enrollments;

create policy "Users can create pending enrollments"
  on public.enrollments for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

-- SEC-20  The admin reject route deletes enrollments but no DELETE policy
--         existed, so the delete silently affected zero rows.
drop policy if exists "Admins can delete enrollments" on public.enrollments;

create policy "Admins can delete enrollments"
  on public.enrollments for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- SEC-03  Payment forgery: students could insert their own 'approved' payment
--         rows, with an arbitrary amount and a real admin in approved_by.
--
-- The amount is pinned to the course's list price so a client cannot record a
-- 12,000 LKR enrolment as 1.00 (this also closes SEC-10 at the database).
-- ---------------------------------------------------------------------------

drop policy if exists "Users can create payments" on public.payments;

create policy "Users can create pending payments"
  on public.payments for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and approved_by is null
    and amount = (select price from public.courses where id = course_id)
  );

-- ---------------------------------------------------------------------------
-- SEC-04  The marks view runs with owner privileges (views cannot carry RLS),
--         so reading it directly bypassed the per-student policy on
--         student_marks and exposed every student's name, ID, marks and rank.
--
-- Rank and class average are genuine cross-student aggregates, so the view has
-- to keep definer rights to compute them. Instead we remove direct access: only
-- the service role may read it, and the API routes filter by the caller.
-- ---------------------------------------------------------------------------

revoke all on public.student_marks_with_ranks from anon, authenticated;

-- ---------------------------------------------------------------------------
-- SEC-07  check-phone previously derived its answer partly from is_admin,
--         which let an unauthenticated caller identify administrator accounts.
--         It now answers purely from password_set_at, so any admin seeded by
--         hand needs that column populated or they lose the password login.
-- ---------------------------------------------------------------------------

update public.users
set profile_completed_at = coalesce(profile_completed_at, now()),
    password_set_at      = coalesce(password_set_at, now())
where is_admin = true;

-- ---------------------------------------------------------------------------
-- SEC-05  Storage: the lms-assets bucket was created with public: true, so
--         every bank slip — account numbers, names, transfer amounts — was
--         readable by anyone holding the URL, with no expiry.
--
-- Flipping the flag revokes anonymous read from existing objects too. Reads now
-- go through /api/assets/sign, which checks ownership and issues a short-lived
-- signed URL. No storage policies are added for anon or authenticated: the
-- service role is the only thing that should touch this bucket.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('lms-assets', 'lms-assets', false)
on conflict (id) do update set public = false;

-- ---------------------------------------------------------------------------
-- SEC-06 / SEC-08  Rate limiting and OTP lockout
--
-- No Redis in this stack, so the counters live in Postgres. Deny-all RLS: only
-- the service role touches this table, and only from server routes.
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,       -- e.g. 'otp:send', 'otp:verify', 'auth:check-phone'
  subject text not null,      -- phone number, IP address, or 'global'
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on public.rate_limits(bucket, subject, created_at desc);

alter table public.rate_limits enable row level security;
-- Intentionally no policies: deny-all to anon and authenticated.

-- Housekeeping: counters older than a day are never consulted.
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where created_at < now() - interval '1 day';
$$;

-- Supports the per-phone failure window used by the OTP verify route.
create index if not exists otp_codes_phone_verified_idx
  on public.otp_codes(phone_number, verified_at, expires_at desc);
