/**
 * The canonical public origin of this deployment.
 *
 * Anything a payment gateway is told to call back must come from here rather
 * than from the browser: a client that supplies its own notify_url can point
 * the server-to-server callback somewhere else, leaving money taken and the
 * enrolment never activated.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL

  if (configured) {
    const withScheme = configured.startsWith('http')
      ? configured
      : `https://${configured}`
    return withScheme.replace(/\/$/, '')
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}
