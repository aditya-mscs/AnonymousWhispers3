import { type NextRequest, NextResponse } from "next/server"
import { getSecretById, addComment, updateSecretInteractions, hashIp } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("API route: Fetching secret with ID:", params.id)

    // Add more detailed logging
    console.log("API route: About to call getSecretById")
    const secret = await getSecretById(params.id)
    console.log("API route: DB response:", secret ? "Secret found" : "Secret not found")

    if (!secret) {
      console.log("API route: Secret not found")
      return NextResponse.json({ error: "Secret not found", id: params.id }, { status: 404 })
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
        id: params.id,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
      secretId: params.id,
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action } = body

    if (!["share", "view"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await updateSecretInteractions(params.id, action)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error updating secret interactions:", error)
    return NextResponse.json({ error: "Failed to update secret interactions" }, { status: 500 })
  }
}

