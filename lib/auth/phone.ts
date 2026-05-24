export const normalizePhoneNumber = (phone: string) => {
  const trimmed = phone.trim().replace(/[\s()-]/g, '')

  if (trimmed.startsWith('+')) {
    return trimmed
  }

  if (trimmed.startsWith('0')) {
    return `+94${trimmed.slice(1)}`
  }

  if (trimmed.startsWith('94')) {
    return `+${trimmed}`
  }

  return trimmed
}

export const phoneToAuthEmail = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@phone.lms.local`
}
