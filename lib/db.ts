try {
  // This is just to ensure the module loads without errors
  console.log("Initializing DB module")
} catch (error) {
  console.error("Error initializing DB module:", error)
}

import { v4 as uuidv4 } from "uuid"
import { docClient, SECRETS_TABLE, COMMENTS_TABLE } from "./db-models"
import { PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import type { Secret as SecretType, Comment as CommentType } from "@/types/secret"
import { getAwsEnvironment } from "./aws-env"
import { hashIp } from "./crypto-utils"

// Get environment variables
const awsEnv = getAwsEnvironment()

// Function to save a new secret
export async function saveSecret(
  secretData: Omit<SecretType, "id" | "comments" | "views" | "shares">,
): Promise<SecretType> {
  const id = uuidv4()

  try {
    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: SECRETS_TABLE,
        Item: {
          id,
          content: secretData.content,
          darkness: secretData.darkness,
          username: secretData.username,
          ipHash: secretData.ipHash,
          createdAt: secretData.createdAt instanceof Date ? secretData.createdAt.toISOString() : secretData.createdAt,
          views: 0,
          shares: 0,
        },
      }),
    )

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
    throw error
  }
}

// Function to get a secret by ID
export async function getSecretById(id: string): Promise<SecretType | null> {
  try {
    // Get the secret from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: SECRETS_TABLE,
        Key: { id },
      }),
    )

    if (!result.Item) {
      return null
    }

    // Increment view count
    await docClient.send(
      new UpdateCommand({
        TableName: SECRETS_TABLE,
        Key: { id },
        UpdateExpression: "SET views = if_not_exists(views, :zero) + :one",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":one": 1,
        },
        ReturnValues: "NONE",
      }),
    )

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
      views: (result.Item.views || 0) + 1, // Include the view we just added
      shares: result.Item.shares || 0,
    }
  } catch (error) {
    console.error("Error fetching secret:", error)
    return null
  }
}

// Modify the getSecrets function to handle errors better
export async function getSecrets(type = "recent", limit = 10, page = 1): Promise<SecretType[]> {
  try {
    console.log(`DB: getSecrets called with type=${type}, limit=${limit}, page=${page}`)
    console.log(`DB: Using tables - SECRETS_TABLE=${SECRETS_TABLE}, COMMENTS_TABLE=${COMMENTS_TABLE}`)

    let secrets: any[] = []
    const offset = (page - 1) * limit

    try {
      // Query DynamoDB based on the type
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: SECRETS_TABLE,
        }),
      )

      secrets = scanResult.Items || []
      console.log(`DB: Found ${secrets.length} secrets before sorting/pagination`)
    } catch (error) {
      console.error("Error scanning DynamoDB:", error)
      // Return empty array instead of throwing
      return []
    }

    // Sort based on type
    switch (type) {
      case "dark":
        // Sort by darkness level in descending order (darkest first)
        secrets.sort((a, b) => b.darkness - a.darkness)
        break

      case "trending":
        // For trending, we need to calculate based on interactions and darkness
        // Get comments for each secret to calculate trending score
        for (const secret of secrets) {
          try {
            const comments = await getCommentsBySecretId(secret.id)
            secret.commentCount = comments.length
          } catch (error) {
            console.error(`Error getting comments for secret ${secret.id}:`, error)
            secret.commentCount = 0
          }
        }

        // Sort by a "trending score" that includes darkness level
        secrets.sort((a, b) => {
          // Calculate trending score: (views + shares*2 + comments*3) * (darkness/5)
          const aScore = ((a.views || 0) + (a.shares || 0) * 2 + (a.commentCount || 0) * 3) * (a.darkness / 5)
          const bScore = ((b.views || 0) + (b.shares || 0) * 2 + (b.commentCount || 0) * 3) * (a.darkness / 5)
          return bScore - aScore // Descending order
        })
        break

      default: // recent
        // Sort by creation date in descending order (newest first)
        secrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Apply pagination
    console.log(`DB: Applying pagination with offset=${offset}, limit=${limit}`)
    secrets = secrets.slice(offset, offset + limit)
    console.log(`DB: After pagination, returning ${secrets.length} secrets`)

    // Get comments for each secret
    const secretsWithComments = await Promise.all(
      secrets.map(async (secret) => {
        let comments = []
        try {
          comments = await getCommentsBySecretId(secret.id)
        } catch (error) {
          console.error(`Error getting comments for secret ${secret.id}:`, error)
        }

        return {
          id: secret.id,
          content: secret.content,
          darkness: secret.darkness,
          username: secret.username,
          createdAt: secret.createdAt,
          comments,
          views: secret.views || 0,
          shares: secret.shares || 0,
        }
      }),
    )

    return secretsWithComments
  } catch (error) {
    console.error("Error fetching secrets:", error)

    // Return an empty array instead of throwing an error
    // This prevents the application from crashing when there's a DB error
    return []
  }
}

// Function to get comments by secret ID
export async function getCommentsBySecretId(secretId: string): Promise<CommentType[]> {
  try {
    // Query using the SecretIdIndex GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: COMMENTS_TABLE,
        IndexName: "SecretIdIndex",
        KeyConditionExpression: "secretId = :secretId",
        ExpressionAttributeValues: {
          ":secretId": secretId,
        },
      }),
    )

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

  try {
    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: COMMENTS_TABLE,
        Item: {
          id,
          secretId: commentData.secretId,
          content: commentData.content,
          username: commentData.username,
          ipHash: commentData.ipHash,
          createdAt: commentData.createdAt.toISOString(),
        },
      }),
    )

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

    const updateExpression =
      action === "share"
        ? "SET shares = if_not_exists(shares, :zero) + :one"
        : "SET views = if_not_exists(views, :zero) + :one"

    await docClient.send(
      new UpdateCommand({
        TableName: SECRETS_TABLE,
        Key: { id: secretId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ":zero": 0,
          ":one": 1,
        },
      }),
    )

    // Update the local object
    if (action === "share") {
      secret.shares = (secret.shares || 0) + 1
    } else if (action === "view") {
      secret.views = (secret.views || 0) + 1
    }

    return secret
  } catch (error) {
    console.error("Error updating secret interactions:", error)
    return null
  }
}

// Add this function to check how many submissions an IP has made
export async function getSubmissionCountByIp(ipHash: string): Promise<number> {
  try {
    // In a real implementation, you would query your database
    // to count submissions from this IP hash
    const result = await docClient.send(
      new ScanCommand({
        TableName: SECRETS_TABLE,
        FilterExpression: "ipHash = :ipHash",
        ExpressionAttributeValues: {
          ":ipHash": ipHash,
        },
        Select: "COUNT",
      }),
    )

    return result.Count || 0
  } catch (error) {
    console.error("Error checking submission count:", error)
    return 0 // Default to first submission on error
  }
}

// Define the report type
interface ReportData {
  secretId: string
  reason: string
  username: string
  ipHash: string
  createdAt: Date
}

// Function to report a secret
export async function reportSecret(reportData: ReportData): Promise<{ success: boolean; message?: string }> {
  try {
    // Check if user already reported this secret
    const existingReports = await docClient.send(
      new ScanCommand({
        TableName: "anonymous-dark-secrets-reports",
        FilterExpression: "secretId = :secretId AND ipHash = :ipHash",
        ExpressionAttributeValues: {
          ":secretId": reportData.secretId,
          ":ipHash": reportData.ipHash,
        },
      }),
    )

    if (existingReports.Items && existingReports.Items.length > 0) {
      return { success: false, message: "You have already reported this secret" }
    }

    // Get the secret to update report count
    const secretResult = await docClient.send(
      new GetCommand({
        TableName: SECRETS_TABLE,
        Key: { id: reportData.secretId },
      }),
    )

    if (!secretResult.Item) {
      return { success: false, message: "Secret not found" }
    }

    // Update the secret with report count
    const secret = secretResult.Item
    const reportCount = secret.reportCount || 0
    const reportedBy = secret.reportedBy || []

    // Add the username to reportedBy array if not already there
    if (!reportedBy.includes(reportData.username)) {
      reportedBy.push(reportData.username)
    }

    // Update the secret with new report count and reportedBy array
    await docClient.send(
      new UpdateCommand({
        TableName: SECRETS_TABLE,
        Key: { id: reportData.secretId },
        UpdateExpression: "SET reportCount = :reportCount, reportedBy = :reportedBy",
        ExpressionAttributeValues: {
          ":reportCount": reportCount + 1,
          ":reportedBy": reportedBy,
        },
      }),
    )

    // Save report record for admin review
    const id = uuidv4()
    await docClient.send(
      new PutCommand({
        TableName: "anonymous-dark-secrets-reports",
        Item: {
          id,
          secretId: reportData.secretId,
          reason: reportData.reason,
          username: reportData.username,
          ipHash: reportData.ipHash,
          createdAt: reportData.createdAt.toISOString(),
          status: "pending", // pending, reviewed, dismissed
        },
      }),
    )

    return { success: true }
  } catch (error) {
    console.error("Error reporting secret:", error)
    return { success: false, message: "Failed to submit report" }
  }
}

// Function to get all reported secrets (for admin)
export async function getReportedSecrets(): Promise<any[]> {
  try {
    // Get all reports
    const reportsResult = await docClient.send(
      new ScanCommand({
        TableName: "anonymous-dark-secrets-reports",
      }),
    )

    const reports = reportsResult.Items || []

    // Group reports by secretId
    const reportsBySecret = new Map()

    for (const report of reports) {
      const secretId = report.secretId
      const reportsForSecret = reportsBySecret.get(secretId) || []
      reportsForSecret.push(report)
      reportsBySecret.set(secretId, reportsForSecret)
    }

    // Get details for each reported secret
    const reportedSecrets = []

    for (const [secretId, secretReports] of reportsBySecret.entries()) {
      const secret = await getSecretById(secretId)

      if (secret) {
        reportedSecrets.push({
          secret,
          reports: secretReports,
          reportCount: secretReports.length,
        })
      }
    }

    // Sort by number of reports (most reported first)
    reportedSecrets.sort((a, b) => b.reportCount - a.reportCount)

    return reportedSecrets
  } catch (error) {
    console.error("Error getting reported secrets:", error)
    return []
  }
}

export { hashIp }

