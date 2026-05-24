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
      {
        name: 'http-query',
        url: buildHttpApiUrl(apiUrl, apiKey, cleanPhoneNumber, message, senderId),
        init: {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      },
    ]

    let lastError = 'Unknown FitSMS error'

    for (const attempt of attempts) {
      console.log(`FitSMS attempt: ${attempt.name}`)
      console.log(`FitSMS API URL: ${maskToken(attempt.url)}`)
      console.log(`Sending SMS to ${cleanPhoneNumber}`)

      const response = await fetch(attempt.url, attempt.init)
      const responseText = await response.text()
      console.log(`FitSMS HTTP Status: ${response.status}`)
      console.log(`FitSMS Response:`, responseText)

      const result = parseSmsResponse(responseText)

      if (response.ok && result.status !== 'error') {
        console.log(`SMS sent successfully to ${cleanPhoneNumber}`)
        return result
      }

      lastError =
        result.message ||
        result.error ||
        `HTTP ${response.status}: ${response.statusText || responseText}`
    }

    throw new Error(`FitSMS API Error: ${lastError}`)
  } catch (error) {
    console.error(`FitSMS Error:`, error)
    throw error
  }
}

function buildHttpApiUrl(
  apiUrl: string,
  apiKey: string,
  to: string,
  message: string,
  senderId: string
) {
  const url = new URL(apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`)
  url.search = new URLSearchParams({
    token: apiKey,
    to,
    message,
    sender_id: senderId,
  }).toString()

  return url.toString()
}

function parseSmsResponse(responseText: string) {
  try {
    return JSON.parse(responseText)
  } catch {
    return { raw: responseText }
  }
}

function maskToken(url: string) {
  const safeUrl = new URL(url)
  if (safeUrl.searchParams.has('token')) {
    safeUrl.searchParams.set('token', '***')
  }

  return safeUrl.toString()
}
