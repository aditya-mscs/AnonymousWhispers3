import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin"
import { getSecretById } from "@/lib/db"
import { postToTwitter, postToInstagram } from "@/lib/social-sharing"

export async function POST(request: Request) {
  try {
    // Check admin session
    if (!checkAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { secretId, platforms } = body

    if (!secretId) {
      return NextResponse.json({ error: "Secret ID is required" }, { status: 400 })
    }

    // Get the secret
    const secret = await getSecretById(secretId)
    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 })
    }

    // Share on selected platforms
    const results = {
      twitter: false,
      instagram: false,
    }

    if (!platforms || platforms.includes("twitter")) {
      results.twitter = await postToTwitter(secret)
    }

    if (!platforms || platforms.includes("instagram")) {
      results.instagram = await postToInstagram(secret)
    }

    return NextResponse.json({
      success: true,
      message: "Secret shared on selected social media platforms",
      results,
    })
  } catch (error) {
    console.error("Error sharing on social media:", error)
    return NextResponse.json(
      {
        error: "Failed to share on social media",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

