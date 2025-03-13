import { type NextRequest, NextResponse } from "next/server"
import { hashIp } from "./db"

// In-memory store for rate limiting
// In production, you'd use Redis or another distributed cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up the store periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

interface RateLimitOptions {
  limit: number // Maximum number of requests
  windowMs: number // Time window in milliseconds
  identifier?: string // Optional custom identifier
}

/**
 * Rate limiting middleware for API routes
 */
export function rateLimit(req: NextRequest, options: RateLimitOptions) {
  const { limit, windowMs } = options

  // Get client IP
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const hashedIp = hashIp(ip)

  // Use custom identifier or IP hash
  const identifier = options.identifier || hashedIp

  // Get current timestamp
  const now = Date.now()

  // Get or create rate limit data for this identifier
  const rateData = rateLimitStore.get(identifier) || {
    count: 0,
    resetTime: now + windowMs,
  }

  // If the reset time has passed, reset the counter
  if (rateData.resetTime < now) {
    rateData.count = 0
    rateData.resetTime = now + windowMs
  }

  // Increment request count
  rateData.count++

  // Update store
  rateLimitStore.set(identifier, rateData)

  // Check if limit exceeded
  const remaining = Math.max(0, limit - rateData.count)
  const reset = Math.ceil((rateData.resetTime - now) / 1000) // in seconds

  // Set rate limit headers
  const headers = new Headers()
  headers.set("X-RateLimit-Limit", limit.toString())
  headers.set("X-RateLimit-Remaining", remaining.toString())
  headers.set("X-RateLimit-Reset", reset.toString())

  // If limit exceeded, return 429 Too Many Requests
  if (rateData.count > limit) {
    return NextResponse.json(
      { error: "Too many requests, please try again later." },
      {
        status: 429,
        headers,
      },
    )
  }

  // Return headers to be added to the response
  return { headers }
}

