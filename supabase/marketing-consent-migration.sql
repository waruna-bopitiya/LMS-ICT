-- Records whether a student agreed to marketing messages, and which site they
-- registered on (e.g. 'seminar'). Written only by the service role in
-- /api/student/profile, so no column grant to authenticated is needed.
alter table public.users
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists signup_source text;
