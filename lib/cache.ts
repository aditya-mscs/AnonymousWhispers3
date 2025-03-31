const cache = new Map<string, { data: any; timestamp: number; ttl?: number }>()
const DEFAULT_TTL = 60 * 1000 // 1 minute

export function getFromCache<T>(key: string): T | null {
  const item = cache.get(key)
  if (!item) return null

  // Check if item is expired
  if (Date.now() - item.timestamp > DEFAULT_TTL) {
    cache.delete(key)
    return null
  }

  return item.data as T
}

export function setInCache(key: string, data: any, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

export function invalidateCache(keyPattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(keyPattern)) {
      cache.delete(key)
    }
  }
}

