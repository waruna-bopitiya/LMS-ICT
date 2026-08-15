type SendSmsParams = {
  to: string
  message: string
}

type SmsAttempt = {
  name: string
  url: string
  init: RequestInit
}

export async function sendFitsms({ to, message }: SendSmsParams) {
  const apiUrl = process.env.FITSMS_API_URL
  const apiKey = process.env.FITSMS_API_KEY
  const senderId = process.env.FITSMS_SENDER_ID || 'LMS'

  if (!apiUrl || !apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      // Development only: the code has to be readable somewhere to test with.
      console.info(`[SMS dev mode] ${to}: ${message}`)
      return
    }

    throw new Error('Missing FitSMS configuration')
  }

  const cleanPhoneNumber = to.replace(/\D/g, '')

  try {
    const configuredUrl = new URL(apiUrl)
    const baseUrl = `${configuredUrl.protocol}//${configuredUrl.host}`
    const jsonBody = JSON.stringify({
      recipient: cleanPhoneNumber,
      sender_id: senderId,
      type: 'plain',
      message,
    })

    const jsonHeaders = {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    // Header-authenticated attempts only. The legacy query-string form put the
    // API key in the URL, where it lands in the provider's access logs and in
    // any proxy along the way.
    const attempts: SmsAttempt[] = [
      {
        name: 'v4-json',
        url: `${baseUrl}/api/v4/sms/send`,
        init: {
          method: 'POST',
          headers: jsonHeaders,
          body: jsonBody,
        },
      },
      {
        name: 'v3-json',
        url: `${baseUrl}/api/v3/sms/send`,
        init: {
          method: 'POST',
          headers: jsonHeaders,
          body: jsonBody,
        },
      },
    ]

    let lastError = 'Unknown FitSMS error'

    for (const attempt of attempts) {
      const response = await fetch(attempt.init.method === 'POST' ? attempt.url : attempt.url, {
        ...attempt.init,
        signal: AbortSignal.timeout(15_000),
      })
      const responseText = await response.text()
      const result = parseSmsResponse(responseText)

      if (response.ok && result.status !== 'error') {
        // Recipient numbers and message bodies stay out of the logs.
        console.log(`SMS sent via ${attempt.name} to ${maskPhone(cleanPhoneNumber)}`)
        return result
      }

      console.warn(`FitSMS ${attempt.name} failed with HTTP ${response.status}`)

      lastError =
        result.message ||
        result.error ||
        `HTTP ${response.status}: ${response.statusText}`
    }

    throw new Error(`FitSMS API Error: ${lastError}`)
  } catch (error) {
    console.error(`FitSMS Error:`, error)
    throw error
  }
}

function parseSmsResponse(responseText: string) {
  try {
    return JSON.parse(responseText)
  } catch {
    return { raw: responseText }
  }
}

/** Keeps enough of the number to correlate a log line, not enough to identify. */
function maskPhone(phone: string) {
  return phone.length > 4 ? `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}` : '****'
}
