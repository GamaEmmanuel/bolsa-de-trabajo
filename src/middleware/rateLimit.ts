/**
 * Rate Limiting Middleware for API Routes
 *
 * Prevents abuse by limiting the number of requests from a single IP address
 * within a specified time window.
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Note: In production with multiple instances, consider using Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if a request should be rate limited
 *
 * @param req - The Next.js request object
 * @param maxRequests - Maximum number of requests allowed in the time window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  req: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  // Get IP address from headers (works with most proxies and load balancers)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  const now = Date.now()
  const limitKey = `${ip}`

  const entry = rateLimitStore.get(limitKey)

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(limitKey, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`)
    return false
  }

  // Increment counter
  entry.count++
  return true
}

/**
 * Rate limit response helper
 * Returns a 429 Too Many Requests response
 */
export function rateLimitResponse(retryAfter: number = 60): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      message: 'Rate limit exceeded'
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0'
      }
    }
  )
}

/**
 * Create a rate limiter middleware wrapper
 *
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 * @returns Middleware function
 */
export function createRateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
  return (req: NextRequest): NextResponse | null => {
    if (!checkRateLimit(req, maxRequests, windowMs)) {
      return rateLimitResponse(Math.ceil(windowMs / 1000))
    }
    return null // Allow request to continue
  }
}

/**
 * Preset rate limiters for different use cases
 */
export const RateLimiters = {
  // Strict: 5 requests per minute (for sensitive operations)
  strict: (req: NextRequest) => createRateLimiter(5, 60000)(req),

  // Standard: 10 requests per minute (default)
  standard: (req: NextRequest) => createRateLimiter(10, 60000)(req),

  // Generous: 30 requests per minute (for read operations)
  generous: (req: NextRequest) => createRateLimiter(30, 60000)(req),

  // Email: 3 requests per minute (prevent email spam)
  email: (req: NextRequest) => createRateLimiter(3, 60000)(req),

  // Payment: 5 requests per 5 minutes (prevent checkout spam)
  payment: (req: NextRequest) => createRateLimiter(5, 5 * 60000)(req),
}

