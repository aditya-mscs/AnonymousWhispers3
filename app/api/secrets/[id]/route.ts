import { type NextRequest, NextResponse } from "next/server"
import { getSecretById, addComment, updateSecretInteractions, hashIp } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const secret = await getSecretById(params.id)

    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 })
    }

    return NextResponse.json({ secret })
  } catch (error) {
    console.error("Error fetching secret:", error)
    return NextResponse.json({ error: "Failed to fetch secret" }, { status: 500 })
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

