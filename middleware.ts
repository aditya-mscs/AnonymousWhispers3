import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logError } from "./lib/monitoring"

export function middleware(request: NextRequest) {
  try {
    // Add request ID for tracking
    const requestId = crypto.randomUUID()
    const response = NextResponse.next()

    // Add headers for monitoring
    response.headers.set("x-request-id", requestId)

    // You could add rate limiting, bot protection, etc. here

    return response
  } catch (error) {
    logError(error as Error, {
      url: request.url,
      method: request.method,
    })
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/api/:path*", "/secret/:path*"],
}

