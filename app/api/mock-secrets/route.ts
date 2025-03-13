import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Generate mock secrets
function generateMockSecrets(count = 10) {
  const secrets = []

  const contents = [
    "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
    "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
    "I've been living a double life online for years. My family has no idea about my alter ego or the community I'm part of.",
    "I pretend to be happy on social media, but I cry myself to sleep almost every night. No one knows how broken I really am.",
    "I've been faking my academic credentials for years. My entire career is built on a lie, and I live in constant fear of being exposed.",
    "I stole money from my parents when I was a teenager. They never found out, but the guilt has stayed with me for decades.",
    "I'm in love with my best friend's partner and have been for years. I hate myself for these feelings but can't make them stop.",
    "I witnessed a crime years ago and never reported it. Sometimes I wonder if I could have prevented future incidents.",
    "I've been secretly recording my neighbors for months because I think they're up to something suspicious.",
    "I'm terrified of dying alone, but I push away everyone who gets close to me because I'm afraid of being hurt.",
  ]

  for (let i = 0; i < count; i++) {
    const id = uuidv4()
    const contentIndex = i % contents.length
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    secrets.push({
      id,
      content: contents[contentIndex],
      darkness: Math.floor(Math.random() * 10) + 1,
      username: `Anonymous${Math.floor(Math.random() * 1000)}`,
      createdAt: date.toISOString(),
      comments: [],
      views: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 20),
    })
  }

  return secrets
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type") || "recent"
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10)
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10)

    // Generate mock secrets
    let secrets = generateMockSecrets(20)

    // Sort based on type
    if (type === "dark") {
      secrets.sort((a, b) => b.darkness - a.darkness)
    } else if (type === "trending") {
      secrets.sort((a, b) => b.views + b.shares - (a.views + a.shares))
    } else {
      // recent
      secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit
    secrets = secrets.slice(start, end)

    return NextResponse.json({
      secrets,
      meta: {
        type,
        limit,
        page,
        isMockData: true,
      },
    })
  } catch (error) {
    console.error("Error generating mock secrets:", error)
    return NextResponse.json(
      {
        error: "Failed to generate mock secrets",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, darkness, username } = body

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "Content must be at least 10 characters" }, { status: 400 })
    }

    // Create a mock secret
    const secret = {
      id: uuidv4(),
      content,
      darkness: darkness || 5,
      username: username || `Anonymous${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      comments: [],
      views: 0,
      shares: 0,
    }

    return NextResponse.json({
      success: true,
      secret,
      meta: {
        isMockData: true,
      },
    })
  } catch (error) {
    console.error("Error creating mock secret:", error)
    return NextResponse.json(
      {
        error: "Failed to create mock secret",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

