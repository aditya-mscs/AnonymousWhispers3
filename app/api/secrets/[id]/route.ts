import { type NextRequest, NextResponse } from "next/server"
import { getSecretById, addComment, updateSecretInteractions, hashIp } from "@/lib/db"
import { extractLastSegment } from "@/lib/url-utils"

// Update the GET function to extract ID from URL
export async function GET(request: NextRequest) {
  let id: string
  try {
    // Extract the ID from the URL path
    id = extractLastSegment(request.url)

    console.log("API route: Fetching secret with ID:", id)

    // Add more detailed logging
    console.log("API route: About to call getSecretById")
    const secret = await getSecretById(id)
    console.log("API route: DB response:", secret ? "Secret found" : "Secret not found")

    if (!secret) {
      console.log("API route: Secret not found")
      return NextResponse.json({ error: "Secret not found", id: id }, { status: 404 })
    }

    console.log("API route: Secret found, returning data")
    return NextResponse.json({ secret })
  } catch (error) {
    console.error("Error fetching secret:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch secret",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        id: id,
      },
      { status: 500 },
    )
  }
}

// Update the POST function to extract ID from URL
export async function POST(request: NextRequest) {
  try {
    // Extract the ID from the URL path
    const id = extractLastSegment(request.url)

    const body = await request.json()
    const { comment, username } = body

    if (!comment || comment.length < 3) {
      return NextResponse.json({ error: "Comment must be at least 3 characters" }, { status: 400 })
    }

    // Check for URLs or phishing attempts
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(comment)) {
      return NextResponse.json({ error: "URLs are not allowed in comments" }, { status: 400 })
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const ipHash = hashIp(ip)

    const result = await addComment({
      secretId: id,
      content: comment,
      username,
      ipHash,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, comment: result })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

// Update the PATCH function to extract ID from URL
export async function PATCH(request: NextRequest) {
  try {
    // Extract the ID from the URL path
    const id = extractLastSegment(request.url)

    const body = await request.json()
    const { action } = body

    if (!["share", "view"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await updateSecretInteractions(id, action)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error updating secret interactions:", error)
    return NextResponse.json({ error: "Failed to update secret interactions" }, { status: 500 })
  }
}

