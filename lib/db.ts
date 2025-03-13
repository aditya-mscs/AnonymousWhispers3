import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import { Secret, Comment } from "./db-models"
import type { Secret as SecretType, Comment as CommentType } from "@/types/secret"

// Hash IP address for privacy
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + process.env.IP_HASH_SALT)
    .digest("hex")
}

// Function to save a new secret
export async function saveSecret(
  secretData: Omit<SecretType, "id" | "comments" | "views" | "shares">,
): Promise<SecretType> {
  const id = uuidv4()

  // Save to DynamoDB
  await Secret.put({
    id,
    content: secretData.content,
    darkness: secretData.darkness,
    username: secretData.username,
    ipHash: secretData.ipHash,
    createdAt: secretData.createdAt,
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
}

// Function to get a secret by ID
export async function getSecretById(id: string): Promise<SecretType | null> {
  try {
    // Get the secret from DynamoDB
    const result = await Secret.get({ id })

    if (!result.Item) {
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
    return null
  }
}

// Function to get secrets by type (recent, dark, trending)
export async function getSecrets(type = "recent", limit = 10, page = 1): Promise<SecretType[]> {
  try {
    let secrets: any[] = []
    const offset = (page - 1) * limit

    // Query DynamoDB based on the type
    switch (type) {
      case "dark":
        // Query using the DarknessIndex GSI, sorted in descending order
        // This is a simplified approach - in a real app, you might need to scan and sort
        const darkResults = await Secret.scan()
        secrets = darkResults.Items || []
        secrets.sort((a, b) => b.darkness - a.darkness)
        break

      case "trending":
        // For trending, we need to calculate based on interactions
        // This is a simplified approach - in a real app, you might have a more sophisticated algorithm
        const trendingResults = await Secret.scan()
        secrets = trendingResults.Items || []

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
        // This is a simplified approach - in a real app, you might need to scan and sort
        const recentResults = await Secret.scan()
        secrets = recentResults.Items || []
        secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Apply pagination
    secrets = secrets.slice(offset, offset + limit)

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
    return []
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
}

// Function to update secret interactions (shares, views)
export async function updateSecretInteractions(secretId: string, action: string): Promise<SecretType | null> {
  try {
    // Get the current secret
    const result = await Secret.get({ id: secretId })

    if (!result.Item) {
      return null
    }

    // Update based on action
    if (action === "share") {
      await Secret.update({
        id: secretId,
        shares: result.Item.shares + 1,
      })
    } else if (action === "view") {
      await Secret.update({
        id: secretId,
        views: result.Item.views + 1,
      })
    }

    // Get comments for this secret
    const comments = await getCommentsBySecretId(secretId)

    // Return the updated secret
    return {
      id: result.Item.id,
      content: result.Item.content,
      darkness: result.Item.darkness,
      username: result.Item.username,
      createdAt: result.Item.createdAt,
      comments,
      views: action === "view" ? result.Item.views + 1 : result.Item.views,
      shares: action === "share" ? result.Item.shares + 1 : result.Item.shares,
    }
  } catch (error) {
    console.error("Error updating secret interactions:", error)
    return null
  }
}

