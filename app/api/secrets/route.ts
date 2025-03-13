import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { saveSecret, getSecrets, hashIp } from "@/lib/db"
import { generateRandomUsername } from "@/lib/utils"

// Schema for validating secret input
const secretSchema = z.object({
  content: z.string().min(10).max(1000),
  darkness: z.number().min(0).max(10).int(),
  username: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ success: true, secret }, { status: 201 })
  } catch (error) {
    console.error("Error creating secret:", error)
    return NextResponse.json(
      {
        error: "Failed to create secret",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("API: GET /api/secrets - Starting request")

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "recent"
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)

    console.log(`API: Fetching secrets with type=${type}, limit=${limit}, page=${page}`)

    const secrets = await getSecrets(type, limit, page)

    console.log(`API: Found ${secrets.length} secrets`)

    // If no secrets were found, return an empty array but with a 200 status
    if (secrets.length === 0) {
      console.log("API: No secrets found, returning empty array")
      return NextResponse.json({
        secrets: [],
        message: "No secrets found. The database may be empty.",
        params: { type, limit, page },
      })
    }

    return NextResponse.json({ secrets })
  } catch (error) {
    console.error("Error fetching secrets:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch secrets",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

