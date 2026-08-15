// Sri Lankan mobile numbers are 9 digits after the country code, always
// starting with 7 (07x locally, +947x internationally).
const LK_MOBILE_SUBSCRIBER = /^7\d{8}$/

/**
 * Returns the number in +94XXXXXXXXX form, or null if it is not a valid
 * Sri Lankan mobile number.
 *
 * Returning null rather than the raw input matters: the auth identity is
 * derived from these digits, so a number that normalizes two different ways
 * silently splits one student into two accounts.
 */
export const normalizePhoneNumber = (phone: string): string | null => {
  if (typeof phone !== 'string') return null

  const clean = phone.trim().replace(/[^\d+]/g, '')

  let subscriber: string

  if (clean.startsWith('+94')) {
    subscriber = clean.slice(3)
  } else if (clean.startsWith('94')) {
    subscriber = clean.slice(2)
  } else if (clean.startsWith('0')) {
    subscriber = clean.slice(1)
  } else if (clean.startsWith('+')) {
    return null // some other country code
  } else {
    subscriber = clean
  }

  if (!LK_MOBILE_SUBSCRIBER.test(subscriber)) return null

  return `+94${subscriber}`
}

/**
 * Same as normalizePhoneNumber but throws, for call sites that have already
 * validated the input and want the non-null type.
 */
export const requirePhoneNumber = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) throw new Error('Invalid Sri Lankan mobile number')
  return normalized
}

export const phoneToAuthEmail = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@phone.lms.local`
}
