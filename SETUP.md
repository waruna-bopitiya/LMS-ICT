# LMS Setup

1. Copy `.env.example` values into `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` to the base Supabase project URL, not the `/rest/v1` URL.
3. Add `SUPABASE_SERVICE_ROLE_KEY` for OTP user creation and session bridging.
4. Add the FitSMS API URL/key/sender values.
5. Run `supabase/schema.sql` in the Supabase SQL editor.

After creating the first admin user, set that profile as admin:

```sql
update public.users
set is_admin = true
where phone_number = '+947XXXXXXXX';
```

Admin users log in with the same OTP page at `/auth/login`, then open
`/admin/dashboard`.
