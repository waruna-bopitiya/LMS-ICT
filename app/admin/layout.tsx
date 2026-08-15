import { requireAdmin } from '@/lib/auth/admin'

/**
 * Server-side gate for every route under /admin.
 *
 * Several admin pages are client components that checked only that someone was
 * signed in. Gating here means a new page under this directory is protected by
 * construction rather than by remembering to add the check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return <>{children}</>
}
