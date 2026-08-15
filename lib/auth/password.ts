export const PASSWORD_MIN_LENGTH = 10

/** Shown next to password fields so the rules are visible before submitting. */
export const PASSWORD_HINT =
  'At least 10 characters, including letters and numbers.'

const MIN_LENGTH = PASSWORD_MIN_LENGTH

// Passwords people actually pick for a Sri Lankan A/L tuition site. Cheap to
// check and it removes the worst of the guessable set; Supabase Auth's leaked
// password protection (Dashboard > Authentication > Policies) should be enabled
// alongside this for the real breach-corpus check.
const COMMON = new Set([
  'password', 'password1', 'password123', '1234567890', '12345678',
  'qwertyuiop', 'iloveyou', 'letmein123', 'admin123', 'welcome123',
  'abcd1234', 'student123', 'srilanka', 'colombo123', 'iseeict123',
])

export type PasswordCheck = { valid: true } | { valid: false; error: string }

export function validatePassword(password: string): PasswordCheck {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_LENGTH} characters long`,
    }
  }

  if (password.length > 72) {
    // bcrypt truncates beyond 72 bytes; reject rather than silently ignore.
    return { valid: false, error: 'Password must be 72 characters or fewer' }
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain both letters and numbers',
    }
  }

  if (COMMON.has(password.toLowerCase())) {
    return {
      valid: false,
      error: 'That password is too common. Please choose a different one.',
    }
  }

  return { valid: true }
}
