// ElevenLabs-Signature: "t=<unix seconds>,v0=<hex HMAC-SHA256 of `${t}.${rawBody}`>". The header
// may carry several v0 values; any match is valid.
const TOLERANCE_SECONDS = 30 * 60

export async function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!header) return false
  const pairs = header.split(',').map((part) => part.trim().split('=', 2))
  const timestamp = pairs.find(([key]) => key === 't')?.[1]
  const signatures = pairs.filter(([key, value]) => key === 'v0' && value).map(([, value]) => value)
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false
  if (Math.abs(nowSeconds - Number(timestamp)) > TOLERANCE_SECONDS) return false

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`)
  return signatures.some((signature) => constantTimeEqual(signature, expected))
}

export async function hmacHex(secret: string, message: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}
