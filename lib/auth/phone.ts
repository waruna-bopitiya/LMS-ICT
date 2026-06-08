export const normalizePhoneNumber = (phone: string) => {
  const trimmed = phone.trim().replace(/[\s()-]/g, '')
  const clean = trimmed.replace(/[^\d+]/g, '')

  if (clean.startsWith('+')) {
    return clean
  }

  if (clean.startsWith('0')) {
    return `+94${clean.slice(1)}`
  }

  if (clean.startsWith('94')) {
    return `+${clean}`
  }

  if (clean.length === 9) {
    return `+94${clean}`
  }

  return clean
}

export const phoneToAuthEmail = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@phone.lms.local`
}

