import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { saveSecret, getSecrets, hashIp, getSubmissionCountByIp } from "@/lib/db"
import { generateRandomUsername } from "@/lib/utils"

// Import the rate limiting utility at the top of the file
import { rateLimit } from "@/lib/rate-limit"
// Add this import at the top
import { validateSubmissionToken } from "@/lib/submission-token"

// Add this import at the top of the file
import { qualifiesForSocialSharing, postToTwitter, postToInstagram } from "@/lib/social-sharing"

// Schema for validating secret input
const secretSchema = z.object({
  content: z.string().min(10).max(1000),
  darkness: z.number().min(0).max(10).int(),
  username: z.string().optional(),
})

// Update the POST function to include rate limiting
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - 5 submissions per IP per 10 minutes
    const rateLimitResult = rateLimit(request, {
      limit: 5,
      windowMs: 10 * 60 * 1000, // 10 minutes
    })

    // If rate limit response is returned, the limit was exceeded
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }

    // Continue with the existing code...
    const body = await request.json()

    // Validate input
    const result = secretSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
    }

    // Check for URLs or phishing attempts
    const content = result.data.content
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(content)) {
      return NextResponse.json({ error: "URLs are not allowed in secrets" }, { status: 400 })
    }

    // Validate submission token
    if (!body.submissionToken || !validateSubmissionToken(body.submissionToken)) {
      // Check if this IP has submitted before
      const ip = request.headers.get("x-forwarded-for") || "unknown"
      const ipHash = hashIp(ip)

      // Get submission count for this IP
      const submissionCount = await getSubmissionCountByIp(ipHash)

      // If this is not their first submission, require a valid token
      if (submissionCount > 0) {
        return NextResponse.json({ error: "Invalid or expired submission token" }, { status: 400 })
      }
      // For first-time users, we'll allow the submission without a token
    }

    // Get IP address for user identification (but keep anonymous)
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const ipHash = hashIp(ip)

    // Generate username if not provided
    const username = result.data.username || generateRandomUsername()

    // Save the secret
    const secret = await saveSecret({
      content: result.data.content,
      darkness: result.data.darkness,
      username,
      ipHash,
      createdAt: new Date(),
    })

    // Check if the secret qualifies for social sharing
    if (qualifiesForSocialSharing(secret)) {
      // Post to social media platforms asynchronously
      // We don't await these to avoid delaying the response to the user
      postToTwitter(secret).catch(console.error)
      postToInstagram(secret).catch(console.error)
    }

    // Add rate limit headers to the response
    const response = NextResponse.json({ success: true, secret }, { status: 201 })
    for (const [key, value] of rateLimitResult.headers.entries()) {
      response.headers.set(key, value)
    }

    return response
  } catch (error) {
    console.error("Error creating secret:", error)
    return NextResponse.json(
      {
        error: "Failed to create secret",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Update the GET function to handle errors better
export async function GET(request: NextRequest) {
  try {
    console.log("API: GET /api/secrets - Starting request")

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "recent"
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)

    console.log(`API: Fetching secrets with type=${type}, limit=${limit}, page=${page}`)

    try {
      const secrets = await getSecrets(type, limit, page)
      console.log(`API: Found ${secrets.length} secrets`)

      // If no secrets were found, return an empty array but with a 200 status
      return NextResponse.json({
        secrets: secrets || [],
        params: { type, limit, page },
      })
    } catch (error) {
      console.error("Error in getSecrets:", error)
      // Return empty array with a message instead of throwing
      return NextResponse.json({
        secrets: [],
        message: "Error fetching secrets. Using fallback data.",
        params: { type, limit, page },
      })
    }
  } catch (error) {
    console.error("Error fetching secrets:", error)
    return NextResponse.json(
      {
        secrets: [],
        error: "Failed to fetch secrets",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

