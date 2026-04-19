// In-memory rate limiter — per Vercel function instance.
// For multi-instance production, replace with Upstash Redis.

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>()
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 20

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}

export function getClientIp(req: Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

// Purge expired entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 10 * 60 * 1000)
