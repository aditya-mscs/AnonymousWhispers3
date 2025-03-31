import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSecrets } from "./db"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "./aws-env"
import { SECRETS_TABLE, COMMENTS_TABLE } from "./db-models"

// Admin credentials - in a real app, store these securely
// For production, use environment variables and a proper auth system
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123" // Fallback for development only
const ADMIN_URL = "/adminportal" // Static URL for admin portal

/**
 * Sets the admin session cookie
 */
export async function setAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set("admin_session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  })
}

/**
 * Clears the admin session cookie
 */
export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
}

// Update the checkAdminSession function to be async
/**
 * Checks if the admin session cookie exists
 */
export async function checkAdminSession() {
  const cookieStore = await cookies()
  return cookieStore.has("admin_session")
}

// Update the requireAdmin function to handle async
/**
 * Middleware to require admin authentication
 * Redirects to login page if not authenticated
 */
export async function requireAdmin() {
  if (await !checkAdminSession()) {
    redirect("/adminportal")
  }
}

/**
 * Verifies the admin password
 * @param password The password to verify
 */
export function verifyAdminPassword(password: string) {
  return password === ADMIN_PASSWORD
}

/**
 * Gets the admin URL
 */
export function getAdminUrl() {
  return ADMIN_URL
}

/**
 * Gets admin dashboard statistics
 * Includes counts of secrets, comments, high darkness secrets, and reported content
 */
export async function getAdminStats() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const docClient = DynamoDBDocumentClient.from(client)

    // Get secrets count
    const secretsResult = await docClient.send(
      new ScanCommand({
        TableName: SECRETS_TABLE,
        Select: "COUNT",
      }),
    )

    // Get comments count
    const commentsResult = await docClient.send(
      new ScanCommand({
        TableName: COMMENTS_TABLE,
        Select: "COUNT",
      }),
    )

    // Get high darkness secrets (8-10)
    const highDarknessResult = await docClient.send(
      new ScanCommand({
        TableName: SECRETS_TABLE,
        FilterExpression: "darkness >= :minDarkness",
        ExpressionAttributeValues: {
          ":minDarkness": 8,
        },
        Select: "COUNT",
      }),
    )

    // Get reported secrets count
    let reportedSecretsCount = 0
    try {
      const reportsResult = await docClient.send(
        new ScanCommand({
          TableName: "anonymous-dark-secrets-reports",
          FilterExpression: "#statusAttr = :statusValue",
          ExpressionAttributeNames: {
            "#statusAttr": "status",
          },
          ExpressionAttributeValues: {
            ":statusValue": "pending",
          },
          Select: "COUNT",
        }),
      )
      reportedSecretsCount = reportsResult.Count || 0
    } catch (error) {
      console.error("Error getting reports count:", error)
    }

    return {
      totalSecrets: secretsResult.Count || 0,
      totalComments: commentsResult.Count || 0,
      highDarknessSecrets: highDarknessResult.Count || 0,
      reportedSecrets: reportedSecretsCount,
      recentActivity: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    return {
      totalSecrets: 0,
      totalComments: 0,
      highDarknessSecrets: 0,
      reportedSecrets: 0,
      recentActivity: new Date().toISOString(),
      error: "Failed to fetch stats",
    }
  }
}

/**
 * Gets all secrets with pagination and filtering for admin view
 * @param page Page number
 * @param limit Number of items per page
 * @param filter Optional filter criteria
 */
export async function getAdminSecrets(page = 1, limit = 10, filter?: { field: string; value: string | number }) {
  try {
    // Get all secrets
    const secrets = await getSecrets("recent", 100, 1)

    // Apply filtering if provided
    let filteredSecrets = secrets
    if (filter && filter.field && filter.value !== undefined) {
      filteredSecrets = secrets.filter((secret) => {
        if (filter.field === "darkness") {
          return secret.darkness === Number(filter.value)
        } else if (filter.field === "username") {
          return secret.username.toLowerCase().includes(String(filter.value).toLowerCase())
        } else if (filter.field === "content") {
          return secret.content.toLowerCase().includes(String(filter.value).toLowerCase())
        }
        return true
      })
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedSecrets = filteredSecrets.slice(startIndex, endIndex)

    return {
      secrets: paginatedSecrets,
      total: filteredSecrets.length,
      page,
      limit,
      totalPages: Math.ceil(filteredSecrets.length / limit),
    }
  } catch (error) {
    console.error("Error getting admin secrets:", error)
    return {
      secrets: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: "Failed to fetch secrets",
    }
  }
}

/**
 * Deletes a secret and its associated comments
 * @param id Secret ID to delete
 */
export async function deleteSecret(id: string) {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const docClient = DynamoDBDocumentClient.from(client)

    // Delete the secret
    await docClient.send(
      new DeleteCommand({
        TableName: SECRETS_TABLE,
        Key: { id },
      }),
    )

    // Also delete all comments for this secret
    const commentsResult = await docClient.send(
      new ScanCommand({
        TableName: COMMENTS_TABLE,
        FilterExpression: "secretId = :secretId",
        ExpressionAttributeValues: {
          ":secretId": id,
        },
      }),
    )

    if (commentsResult.Items && commentsResult.Items.length > 0) {
      for (const comment of commentsResult.Items) {
        await docClient.send(
          new DeleteCommand({
            TableName: COMMENTS_TABLE,
            Key: {
              id: comment.id,
              secretId: comment.secretId,
            },
          }),
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting secret:", error)
    return { success: false, error: "Failed to delete secret" }
  }
}

/**
 * Deletes a comment
 * @param id Comment ID to delete
 * @param secretId Associated secret ID
 */
export async function deleteComment(id: string, secretId: string) {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const docClient = DynamoDBDocumentClient.from(client)

    // Delete the comment
    await docClient.send(
      new DeleteCommand({
        TableName: COMMENTS_TABLE,
        Key: {
          id,
          secretId,
        },
      }),
    )

    return { success: true }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}

/**
 * Gets all reported secrets for admin review
 */
export async function getReportedSecrets() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const docClient = DynamoDBDocumentClient.from(client)

    // Get all reports from DynamoDB
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
      // Get the secret details
      const secretResult = await docClient.send(
        new GetCommand({
          TableName: SECRETS_TABLE,
          Key: { id: secretId },
        }),
      )

      if (secretResult.Item) {
        reportedSecrets.push({
          secret: secretResult.Item,
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

