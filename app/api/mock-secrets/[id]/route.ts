import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Generate a mock secret with the given ID
function generateMockSecret(id: string) {
  const contents = [
    "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
    "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
    "I've been living a double life online for years. My family has no idea about my alter ego or the community I'm part of.",
    "I pretend to be happy on social media, but I cry myself to sleep almost every night. No one knows how broken I really am.",
    "I've been faking my academic credentials for years. My entire career is built on a lie, and I live in constant fear of being exposed.",
  ]

  // Use the ID to deterministically select content
  const contentIndex = Number.parseInt(id.substring(0, 8), 16) % contents.length
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)

  // Generate some mock comments
  const commentCount = Math.floor(Math.random() * 5)
  const comments = []

  for (let i = 0; i < commentCount; i++) {
    comments.push({
      id: uuidv4(),
      content: `This is a mock comment ${i + 1} for secret ${id}`,
      username: `Anonymous${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(date.getTime() - i * 86400000).toISOString(), // 1 day earlier for each comment
    })
  }

  return {
    id,
    content: contents[contentIndex],
    darkness: Math.floor(Math.random() * 10) + 1,
    username: `Anonymous${Math.floor(Math.random() * 1000)}`,
    createdAt: date.toISOString(),
    comments,
    views: Math.floor(Math.random() * 200),
    shares: Math.floor(Math.random() * 20),
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Generate a mock secret with the given ID
    const secret = generateMockSecret(id)

    return NextResponse.json({
      secret,
      meta: {
        isMockData: true,
      },
    })
  } catch (error) {
    console.error("Error generating mock secret:", error)
    return NextResponse.json(
      {
        error: "Failed to generate mock secret",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { comment, username } = body

    if (!comment || comment.length < 3) {
      return NextResponse.json({ error: "Comment must be at least 3 characters" }, { status: 400 })
    }

    // Create a mock comment
    const mockComment = {
      id: uuidv4(),
      content: comment,
      username: username || `Anonymous${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      comment: mockComment,
      meta: {
        isMockData: true,
      },
    })
  } catch (error) {
    console.error("Error creating mock comment:", error)
    return NextResponse.json(
      {
        error: "Failed to create mock comment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

