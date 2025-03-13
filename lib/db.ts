import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import { Secret, Comment } from "./db-models"
import type { Secret as SecretType, Comment as CommentType } from "@/types/secret"

// Mock data for fallback
const mockSecrets: SecretType[] = [
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
  // Add more mock data as needed
]

// Hash IP address for privacy
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT || "default-salt"))
    .digest("hex")
}

// Function to save a new secret
export async function saveSecret(
  secretData: Omit<SecretType, "id" | "comments" | "views" | "shares">,
): Promise<SecretType> {
  const id = uuidv4()

  try {
    // Save to DynamoDB
    await Secret.put({
      id,
      content: secretData.content,
      darkness: secretData.darkness,
      username: secretData.username,
      ipHash: secretData.ipHash,
      createdAt: secretData.createdAt instanceof Date ? secretData.createdAt.toISOString() : secretData.createdAt,
      views: 0,
      shares: 0,
    })

    // Return the new secret
    return {
      id,
      content: secretData.content,
      darkness: secretData.darkness,
      username: secretData.username,
      createdAt: secretData.createdAt instanceof Date ? secretData.createdAt.toISOString() : secretData.createdAt,
      comments: [],
      views: 0,
      shares: 0,
    }
  } catch (error) {
    console.error("Error creating secret:", error)

    // In development, create a mock secret instead
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data instead")
      const mockSecret: SecretType = {
        id,
        content: secretData.content,
        darkness: secretData.darkness,
        username: secretData.username,
        createdAt: secretData.createdAt instanceof Date ? secretData.createdAt.toISOString() : secretData.createdAt,
        comments: [],
        views: 0,
        shares: 0,
      }
      mockSecrets.unshift(mockSecret)
      return mockSecret
    }

    throw error
  }
}

// Function to get a secret by ID
export async function getSecretById(id: string): Promise<SecretType | null> {
  try {
    // Get the secret from DynamoDB
    const result = await Secret.get({ id })

    if (!result.Item) {
      // Check mock data in development
      if (process.env.NODE_ENV === "development") {
        const mockSecret = mockSecrets.find((s) => s.id === id)
        if (mockSecret) return mockSecret
      }
      return null
    }

    // Increment view count
    await Secret.update({
      id,
      views: result.Item.views + 1,
    })

    // Get comments for this secret
    const comments = await getCommentsBySecretId(id)

    // Return the secret with comments
    return {
      id: result.Item.id,
      content: result.Item.content,
      darkness: result.Item.darkness,
      username: result.Item.username,
      createdAt: result.Item.createdAt,
      comments,
      views: result.Item.views + 1, // Include the view we just added
      shares: result.Item.shares,
    }
  } catch (error) {
    console.error("Error fetching secret:", error)

    // In development, use mock data
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data instead")
      return mockSecrets.find((s) => s.id === id) || null
    }

    return null
  }
}

// Function to get secrets by type (recent, dark, trending)
export async function getSecrets(type = "recent", limit = 10, page = 1): Promise<SecretType[]> {
  try {
    console.log(`DB: getSecrets called with type=${type}, limit=${limit}, page=${page}`)
    console.log(
      `DB: Using tables - SECRETS_TABLE=${process.env.SECRETS_TABLE}, COMMENTS_TABLE=${process.env.COMMENTS_TABLE}`,
    )

    let secrets: any[] = []
    const offset = (page - 1) * limit

    // Query DynamoDB based on the type
    switch (type) {
      case "dark":
        // Query using the DarknessIndex GSI, sorted in descending order
        console.log("DB: Fetching dark secrets")
        const darkResults = await Secret.scan()
        secrets = darkResults.Items || []
        console.log(`DB: Found ${secrets.length} secrets before sorting/pagination`)
        secrets.sort((a, b) => b.darkness - a.darkness)
        break

      case "trending":
        // For trending, we need to calculate based on interactions
        console.log("DB: Fetching trending secrets")
        const trendingResults = await Secret.scan()
        secrets = trendingResults.Items || []
        console.log(`DB: Found ${secrets.length} secrets before sorting/pagination`)

        // Get comments for each secret to calculate trending score
        for (const secret of secrets) {
          const comments = await getCommentsBySecretId(secret.id)
          secret.commentCount = comments.length
        }

        // Sort by a "trending score" (views + shares + comments)
        secrets.sort((a, b) => {
          const aScore = (a.views || 0) + (a.shares || 0) + (a.commentCount || 0)
          const bScore = (b.views || 0) + (b.shares || 0) + (b.commentCount || 0)
          return bScore - aScore
        })
        break

      default: // recent
        // Query using the CreatedAtIndex GSI, sorted in descending order
        console.log("DB: Fetching recent secrets")
        const recentResults = await Secret.scan()
        secrets = recentResults.Items || []
        console.log(`DB: Found ${secrets.length} secrets before sorting/pagination`)
        secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Apply pagination
    console.log(`DB: Applying pagination with offset=${offset}, limit=${limit}`)
    secrets = secrets.slice(offset, offset + limit)
    console.log(`DB: After pagination, returning ${secrets.length} secrets`)

    // If no secrets found, return empty array in development
    if (secrets.length === 0 && process.env.NODE_ENV === "development") {
      console.log("DB: No secrets found, using mock data in development")
      return mockSecrets.slice(0, limit)
    }

    // Get comments for each secret
    const secretsWithComments = await Promise.all(
      secrets.map(async (secret) => {
        const comments = await getCommentsBySecretId(secret.id)
        return {
          id: secret.id,
          content: secret.content,
          darkness: secret.darkness,
          username: secret.username,
          createdAt: secret.createdAt,
          comments,
          views: secret.views,
          shares: secret.shares,
        }
      }),
    )

    return secretsWithComments
  } catch (error) {
    console.error("Error fetching secrets:", error)

    // In development, use mock data
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data instead")
      return mockSecrets.slice(0, limit)
    }

    // Re-throw the error to be handled by the caller
    throw error
  }
}

// Function to get comments by secret ID
export async function getCommentsBySecretId(secretId: string): Promise<CommentType[]> {
  try {
    // Query using the SecretIdIndex GSI
    const result = await Comment.query(secretId, {
      index: "SecretIdIndex",
      reverse: false, // Sort in ascending order by creation time
    })

    return (result.Items || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      username: item.username,
      createdAt: item.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching comments:", error)

    // In development, return mock comments
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data instead")
      const mockSecret = mockSecrets.find((s) => s.id === secretId)
      return mockSecret?.comments || []
    }

    return []
  }
}

// Function to add a comment to a secret
export async function addComment(commentData: {
  secretId: string
  content: string
  username: string
  ipHash: string
  createdAt: Date
}): Promise<CommentType> {
  const id = uuidv4()

  try {
    // Save to DynamoDB
    await Comment.put({
      id,
      secretId: commentData.secretId,
      content: commentData.content,
      username: commentData.username,
      ipHash: commentData.ipHash,
      createdAt: commentData.createdAt.toISOString(),
    })

    // Return the new comment
    return {
      id,
      content: commentData.content,
      username: commentData.username,
      createdAt: commentData.createdAt.toISOString(),
    }
  } catch (error) {
    console.error("Error creating comment:", error)
    throw error
  }
}

// Function to update secret interactions (shares, views)
export async function updateSecretInteractions(secretId: string, action: "share" | "view"): Promise<SecretType | null> {
  try {
    const secret = await getSecretById(secretId)

    if (!secret) {
      return null
    }

    const updates: any = {}

    if (action === "share") {
      updates.shares = (secret.shares || 0) + 1
    } else if (action === "view") {
      updates.views = (secret.views || 0) + 1
    }

    await Secret.update({
      id: secretId,
      ...updates,
    })

    return { ...secret, ...updates }
  } catch (error) {
    console.error("Error updating secret interactions:", error)
    return null
  }
}

