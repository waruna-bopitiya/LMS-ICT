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
