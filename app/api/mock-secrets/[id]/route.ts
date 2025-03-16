import { NextResponse } from "next/server"
import type { Secret } from "@/types/secret"
import { extractLastSegment } from "@/lib/url-utils"

// Mock data for testing
const mockSecrets: Record<string, Secret> = {
  "1": {
    id: "1",
    content:
      "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
    darkness: 7,
    username: "ShadowyGhost42",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [],
    views: 120,
    shares: 5,
  },
  "2": {
    id: "2",
    content:
      "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
    darkness: 9,
    username: "MysteriousEnigma77",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [],
    views: 85,
    shares: 2,
  },
}

export async function GET(request: Request) {
  try {
    // Extract the ID from the URL path
    const id = extractLastSegment(request.url)

    console.log("Mock API: Fetching secret with ID:", id)

    // Get the mock secret
    const secret = mockSecrets[id]

    if (!secret) {
      console.log("Mock API: Secret not found")
      return NextResponse.json({ error: "Secret not found" }, { status: 404 })
    }

    console.log("Mock API: Secret found, returning data")
    return NextResponse.json({ secret })
  } catch (error) {
    console.error("Error in mock API:", error)
    return NextResponse.json({ error: "Failed to fetch mock secret" }, { status: 500 })
  }
}

