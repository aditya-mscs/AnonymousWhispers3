import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin"

// Test Twitter credentials
async function testTwitterCredentials(credentials: any) {
  try {
    // In a real implementation, you would use the Twitter API to verify credentials
    // This is a simplified example
    const { apiKey, apiSecret, accessToken, accessSecret } = credentials

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error("Missing required Twitter credentials")
    }

    // Make a simple request to verify credentials
    // For example, get the user's profile
    const response = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `OAuth oauth_consumer_key="${apiKey}",oauth_token="${accessToken}"`,
        // In a real implementation, you would need to properly sign the request
      },
    })

    if (!response.ok) {
      throw new Error("Failed to verify Twitter credentials")
    }

    return { success: true }
  } catch (error) {
    console.error("Error testing Twitter credentials:", error)
    throw error
  }
}

// Test Instagram credentials
async function testInstagramCredentials(credentials: any) {
  try {
    // In a real implementation, you would use the Instagram Graph API to verify credentials
    // This is a simplified example
    const { accessToken } = credentials

    if (!accessToken) {
      throw new Error("Missing required Instagram credentials")
    }

    // Make a simple request to verify credentials
    // For example, get the user's profile
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`)

    if (!response.ok) {
      throw new Error("Failed to verify Instagram credentials")
    }

    return { success: true }
  } catch (error) {
    console.error("Error testing Instagram credentials:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    // Check admin session
    if (!(await checkAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { platform, credentials } = body

    if (!platform || !credentials) {
      return NextResponse.json({ error: "Platform and credentials are required" }, { status: 400 })
    }

    // Test credentials based on platform
    let result
    if (platform === "twitter") {
      result = await testTwitterCredentials(credentials)
    } else if (platform === "instagram") {
      result = await testInstagramCredentials(credentials)
    } else {
      return NextResponse.json({ error: "Invalid platform. Supported platforms: twitter, instagram" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials verified successfully`,
    })
  } catch (error) {
    console.error("Error testing social media credentials:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test credentials" },
      { status: 500 },
    )
  }
}

