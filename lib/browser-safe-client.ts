import { v4 as uuidv4 } from "uuid"
import type { Secret, Comment } from "@/types/secret"

// In-memory storage for mock data
const mockStorage = {
  secrets: new Map<string, any>(),
  comments: new Map<string, any[]>(),
  reports: new Map<string, any[]>(), // Add reports storage
}

// Initialize with some sample data
function initializeMockData() {
  // Sample secrets
  const secrets = [
    {
      id: "mock-1",
      content:
        "I've been pretending to like my job for 5 years. Everyone thinks I'm passionate about it, but I secretly hate every minute.",
      darkness: 7,
      username: "ShadowyGhost42",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      views: 120,
      shares: 5,
    },
    {
      id: "mock-2",
      content:
        "I sabotaged my best friend's job interview because I was jealous of their success. They still don't know it was me.",
      darkness: 9,
      username: "MysteriousEnigma77",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      views: 85,
      shares: 2,
    },
    {
      id: "mock-3",
      content:
        "I've been living a double life online for years. My family has no idea about my alter ego or the community I'm part of.",
      darkness: 6,
      username: "CrypticShade23",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      views: 210,
      shares: 15,
    },
  ]

  // Sample comments
  const comments = [
    {
      id: "comment-1",
      secretId: "mock-1",
      content: "I feel the same way. It's exhausting keeping up the act.",
      username: "VeiledWhisper99",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "comment-2",
      secretId: "mock-3",
      content: "I understand this completely. Sometimes the online version feels more real than my actual life.",
      username: "HiddenSpecter456",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: "comment-3",
      secretId: "mock-3",
      content: "How do you keep the two lives separate? I'm always afraid of being discovered.",
      username: "CovertRevenant789",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
  ]

  // Store in mock storage
  secrets.forEach((secret) => {
    mockStorage.secrets.set(secret.id, secret)
  })

  comments.forEach((comment) => {
    const secretComments = mockStorage.comments.get(comment.secretId) || []
    secretComments.push(comment)
    mockStorage.comments.set(comment.secretId, secretComments)
  })
}

// Initialize mock data
initializeMockData()

// Browser-safe client for secrets operations
export const browserSafeClient = {
  // Get secrets by type
  getSecrets: async (type = "recent", limit = 10, page = 1): Promise<Secret[]> => {
    console.log(`Browser client: Getting secrets with type=${type}, limit=${limit}, page=${page}`)

    // Get all secrets
    let secrets = Array.from(mockStorage.secrets.values())

    // Sort based on type
    switch (type) {
      case "dark":
        secrets.sort((a, b) => b.darkness - a.darkness)
        break
      case "trending":
        secrets.sort((a, b) => {
          const aComments = mockStorage.comments.get(a.id)?.length || 0
          const bComments = mockStorage.comments.get(b.id)?.length || 0
          const aScore = ((a.views || 0) + (a.shares || 0) * 2 + aComments * 3) * (a.darkness / 5)
          const bScore = ((b.views || 0) + (b.shares || 0) * 2 + bComments * 3) * (b.darkness / 5)
          return bScore - aScore
        })
        break
      default: // recent
        secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Apply pagination
    const offset = (page - 1) * limit
    secrets = secrets.slice(offset, offset + limit)

    // Add comments to each secret
    return secrets.map((secret) => ({
      ...secret,
      comments: mockStorage.comments.get(secret.id) || [],
    }))
  },

  // Get a secret by ID
  getSecretById: async (id: string): Promise<Secret | null> => {
    console.log(`Browser client: Getting secret with ID=${id}`)

    const secret = mockStorage.secrets.get(id)
    if (!secret) return null

    // Increment view count
    secret.views = (secret.views || 0) + 1
    mockStorage.secrets.set(id, secret)

    // Add comments
    return {
      ...secret,
      comments: mockStorage.comments.get(id) || [],
    }
  },

  // Create a new secret
  createSecret: async (data: { content: string; darkness: number; username: string }): Promise<Secret> => {
    console.log(`Browser client: Creating new secret`)

    const id = `mock-${uuidv4()}`
    const secret = {
      id,
      content: data.content,
      darkness: data.darkness,
      username: data.username,
      createdAt: new Date().toISOString(),
      views: 0,
      shares: 0,
    }

    mockStorage.secrets.set(id, secret)

    return {
      ...secret,
      comments: [],
    }
  },

  // Add a comment to a secret
  addComment: async (secretId: string, data: { content: string; username: string }): Promise<Comment> => {
    console.log(`Browser client: Adding comment to secret ${secretId}`)

    const secret = mockStorage.secrets.get(secretId)
    if (!secret) throw new Error("Secret not found")

    const comment = {
      id: `comment-${uuidv4()}`,
      secretId,
      content: data.content,
      username: data.username,
      createdAt: new Date().toISOString(),
    }

    const comments = mockStorage.comments.get(secretId) || []
    comments.push(comment)
    mockStorage.comments.set(secretId, comments)

    return comment
  },

  // Update secret interactions
  updateInteractions: async (secretId: string, action: "share" | "view"): Promise<void> => {
    console.log(`Browser client: Updating ${action} for secret ${secretId}`)

    const secret = mockStorage.secrets.get(secretId)
    if (!secret) return

    if (action === "share") {
      secret.shares = (secret.shares || 0) + 1
    } else {
      secret.views = (secret.views || 0) + 1
    }

    mockStorage.secrets.set(secretId, secret)
  },

  // Report a secret
  reportSecret: async (
    secretId: string,
    data: { username: string },
  ): Promise<{ success: boolean; message: string }> => {
    console.log(`Browser client: Reporting secret ${secretId}`)

    const secret = mockStorage.secrets.get(secretId)
    if (!secret) return { success: false, message: "Secret not found" }

    // Initialize reports count if it doesn't exist
    if (!secret.reportCount) {
      secret.reportCount = 0
      secret.reportedBy = []
    }

    // Check if user already reported this secret
    if (secret.reportedBy.includes(data.username)) {
      return { success: false, message: "You have already reported this secret" }
    }

    // Increment report count and add username to reporters
    secret.reportCount++
    secret.reportedBy.push(data.username)

    // Update the secret in storage
    mockStorage.secrets.set(secretId, secret)

    return {
      success: true,
      message: "Thank you for reporting this content. Our team will review it shortly.",
    }
  },

  // Get all reported secrets (for admin)
  getReportedSecrets: async (): Promise<any[]> => {
    console.log(`Browser client: Getting all reported secrets`)

    const reportedSecrets = []

    // Collect all reports
    for (const [secretId, reports] of mockStorage.reports.entries()) {
      const secret = mockStorage.secrets.get(secretId)
      if (secret) {
        reportedSecrets.push({
          secret: {
            id: secret.id,
            content: secret.content,
            darkness: secret.darkness,
            username: secret.username,
            createdAt: secret.createdAt,
          },
          reports: reports,
          reportCount: reports.length,
        })
      }
    }

    // Sort by number of reports (most reported first)
    reportedSecrets.sort((a, b) => b.reportCount - a.reportCount)

    return reportedSecrets
  },
}

