// Redis (Upstash) if env vars set, otherwise in-memory fallback
const TTL_SECONDS = 60 * 60 // 1 hour
const MAX_ENTRIES = 200

type Entry = { value: unknown; expiresAt: number }
const memStore = new Map<string, Entry>()

function memGet(key: string): unknown | null {
  const entry = memStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null }
  return entry.value
}

function memSet(key: string, value: unknown): void {
  if (memStore.size >= MAX_ENTRIES) {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    memStore.forEach((entry, k) => {
      if (entry.expiresAt < oldestTime) { oldestTime = entry.expiresAt; oldestKey = k }
    })
    if (oldestKey) memStore.delete(oldestKey)
  }
  memStore.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 })
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    const { Redis } = require('@upstash/redis')
    return new Redis({ url, token }) as import('@upstash/redis').Redis
  } catch {
    return null
  }
}

export async function cacheGet(key: string): Promise<unknown | null> {
  const redis = getRedis()
  if (redis) {
    try {
      const val = await redis.get(key)
      return val ?? null
    } catch {
      return memGet(key)
    }
  }
  return memGet(key)
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(key, value, { ex: TTL_SECONDS })
      return
    } catch {
      // fall through to memory
    }
  }
  memSet(key, value)
}

export function hashKey(...parts: string[]): string {
  const str = parts.join('||')
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return (h >>> 0).toString(36)
}
