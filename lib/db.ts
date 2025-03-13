import type { Secret, Comment } from "@/types/secret"
import { v4 as uuidv4 } from "uuid"

// Mock database for development
// In production, this would be replaced with actual database calls
const secrets: Secret[] = [
  {
    id: "1",
    content:
      "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
    darkness: 7,
    username: "ShadowyGhost42",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    comments: [
      {
        id: "c1",
        content: "I feel the same way. It's exhausting keeping up the act.",
        username: "VeiledWhisper99",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
    ],
    views: 120,
    shares: 5,
  },
  {
    id: "2",
    content:
      "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
    darkness: 9,
    username: "MysteriousEnigma77",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    comments: [],
    views: 85,
    shares: 2,
  },
  {
    id: "3",
    content:
      "I've been living a double life online for years. My family has no idea about my alter ego or the community I'm part of.",
    darkness: 6,
    username: "CrypticShade23",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    comments: [
      {
        id: "c2",
        content: "I understand this completely. Sometimes the online version feels more real than my actual life.",
        username: "HiddenSpecter456",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
      {
        id: "c3",
        content: "How do you keep the two lives separate? I'm always afraid of being discovered.",
        username: "CovertRevenant789",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      },
    ],
    views: 210,
    shares: 15,
  },
  // Add more mock secrets as needed
]

// Function to save a new secret
export async function saveSecret(secretData: Omit<Secret, "id" | "comments" | "views" | "shares">): Promise<Secret> {
  const newSecret: Secret = {
    id: uuidv4(),
    ...secretData,
    comments: [],
    views: 0,
    shares: 0,
  }

  // In production, this would save to a database
  // For now, we'll just add it to our mock data
  secrets.unshift(newSecret)

  return newSecret
}

// Function to get a secret by ID
export async function getSecretById(id: string): Promise<Secret | null> {
  const secret = secrets.find((s) => s.id === id)

  if (!secret) {
    return null
  }

  // Increment view count
  secret.views = (secret.views || 0) + 1

  return secret
}

// Function to get secrets by type (recent, dark, trending)
export async function getSecrets(type = "recent", limit = 10, page = 1): Promise<Secret[]> {
  const sortedSecrets = [...secrets]

  switch (type) {
    case "dark":
      sortedSecrets.sort((a, b) => b.darkness - a.darkness)
      break
    case "trending":
      sortedSecrets.sort((a, b) => {
        const aInteractions = (a.comments?.length || 0) + (a.shares || 0) + (a.views || 0)
        const bInteractions = (b.comments?.length || 0) + (b.shares || 0) + (b.views || 0)
        return bInteractions - aInteractions
      })
      break
    default: // recent
      sortedSecrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Apply pagination
  const start = (page - 1) * limit
  const end = start + limit

  return sortedSecrets.slice(start, end)
}

// Function to add a comment to a secret
export async function addComment(commentData: {
  secretId: string
  content: string
  username: string
  ipHash: string
  createdAt: Date
}): Promise<Comment> {
  const { secretId, ...commentInfo } = commentData

  const secret = await getSecretById(secretId)
  if (!secret) {
    throw new Error("Secret not found")
  }

  const newComment: Comment = {
    id: uuidv4(),
    ...commentInfo,
    createdAt: commentInfo.createdAt.toISOString(),
  }

  // Add comment to the secret
  if (!secret.comments) {
    secret.comments = []
  }

  secret.comments.push(newComment)

  return newComment
}

// Function to update secret interactions (shares, views)
export async function updateSecretInteractions(secretId: string, action: string): Promise<Secret> {
  const secret = await getSecretById(secretId)
  if (!secret) {
    throw new Error("Secret not found")
  }

  if (action === "share") {
    secret.shares = (secret.shares || 0) + 1
  } else if (action === "view") {
    secret.views = (secret.views || 0) + 1
  }

  return secret
}

