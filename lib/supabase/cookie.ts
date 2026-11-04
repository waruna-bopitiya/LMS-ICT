// Set NEXT_PUBLIC_COOKIE_DOMAIN=.iseeict.com in production so the session
// cookie is shared with sibling sites such as seminar.iseeict.com.
// Left unset (localhost, previews) the cookie stays host-only.
const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN

export const cookieOptions = domain ? { domain } : undefined

// Absolute URLs that `next` may send a student back to after login.
export const ssoHosts = (process.env.NEXT_PUBLIC_SSO_ALLOWED_HOSTS || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean)

/**
 * Where to send a student after login or profile setup: a same-origin relative
 * path, or an https URL on an allowlisted sibling site. Anything else is null,
 * so `next` cannot become an open redirect.
 */
export const safeNext = (value: string | null) => {
  if (!value) return null
  if (/^\/(?!\/)[\w\-./?=&%]*$/.test(value)) return value
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ssoHosts.includes(url.hostname) ? url.toString() : null
  } catch {
    return null
  }
}

/** Follows a safeNext target, leaving the app for absolute URLs. */
export const goTo = (target: string, push: (href: string) => void) => {
  if (/^https:/.test(target)) window.location.assign(target)
  else push(target)
}
