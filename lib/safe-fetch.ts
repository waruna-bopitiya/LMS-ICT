import dns from 'node:dns/promises'
import net from 'node:net'

/**
 * Blocks server-side requests to addresses that are not on the public internet.
 *
 * The video proxy fetches a URL stored in the database and streams the response
 * back to the caller, which is exactly the shape that turns into a read of
 * cloud metadata or an internal service if the URL is ever attacker-influenced.
 */

const BLOCKED_V4 = [
  { cidr: '0.0.0.0/8' },
  { cidr: '10.0.0.0/8' },
  { cidr: '100.64.0.0/10' },
  { cidr: '127.0.0.0/8' },
  { cidr: '169.254.0.0/16' }, // cloud metadata
  { cidr: '172.16.0.0/12' },
  { cidr: '192.0.0.0/24' },
  { cidr: '192.168.0.0/16' },
  { cidr: '198.18.0.0/15' },
  { cidr: '224.0.0.0/4' },
  { cidr: '240.0.0.0/4' },
]

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
}

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split('/')
  const bits = Number(bitsRaw)
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask)
}

export function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    return BLOCKED_V4.some(({ cidr }) => inCidr(address, cidr))
  }

  if (net.isIPv6(address)) {
    const lower = address.toLowerCase()
    if (lower === '::' || lower === '::1') return true
    if (lower.startsWith('fe80')) return true // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local
    // IPv4-mapped, e.g. ::ffff:169.254.169.254
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }

  return true
}

export class UnsafeUrlError extends Error {}

/**
 * Validates a URL for server-side fetching: https only, a resolvable public
 * host, and optionally a host allowlist.
 *
 * Note this resolves the hostname to check it, which leaves a small window
 * before the actual fetch — acceptable here, where the input is admin-entered
 * rather than arbitrary. An allowlist closes that window entirely.
 */
export async function assertSafeUrl(
  rawUrl: string,
  options: { allowedHosts?: string[] } = {}
): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UnsafeUrlError('Malformed URL')
  }

  if (url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only https URLs may be fetched')
  }

  const hostname = url.hostname.toLowerCase()

  if (options.allowedHosts?.length) {
    const allowed = options.allowedHosts.some(
      host => hostname === host || hostname.endsWith(`.${host}`)
    )
    if (!allowed) {
      throw new UnsafeUrlError('Host is not permitted')
    }
    return url
  }

  if (net.isIP(hostname) && isPrivateAddress(hostname)) {
    throw new UnsafeUrlError('Host resolves to a private address')
  }

  try {
    const records = await dns.lookup(hostname, { all: true })
    if (!records.length || records.some(r => isPrivateAddress(r.address))) {
      throw new UnsafeUrlError('Host resolves to a private address')
    }
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw error
    throw new UnsafeUrlError('Host could not be resolved')
  }

  return url
}
