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

// Session management
export function setAdminSession() {
  const cookieStore = cookies()
  cookieStore.set("admin_session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  })
}

export function clearAdminSession() {
  const cookieStore = cookies()
  cookieStore.delete("admin_session")
}

export function checkAdminSession() {
  const cookieStore = cookies()
  return cookieStore.has("admin_session")
}

export function requireAdmin() {
  if (!checkAdminSession()) {
    redirect("/adminportal")
  }
}

// Admin authentication
export function verifyAdminPassword(password: string) {
  return password === ADMIN_PASSWORD
}

// Add a function to get the admin URL
export function getAdminUrl() {
  return ADMIN_URL
}

// Admin data operations
// Update the getAdminStats function to include reported secrets count
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
          FilterExpression: "status = :status",
          ExpressionAttributeValues: {
            ":status": "pending",
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

// Get all secrets with pagination and filtering
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

// Delete a secret
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

// Delete a comment
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

// Add the getReportedSecrets function
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

    // In development, return mock data
    if (process.env.NODE_ENV === "development") {
      return [
        {
          secret: {
            id: "mock-report-1",
            content: "This is a reported secret with inappropriate content that violates community guidelines.",
            darkness: 9,
            username: "ReportedUser123",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
          reports: [
            {
              id: "report-1",
              secretId: "mock-report-1",
              reason: "This content is inappropriate and offensive",
              username: "Concerned123",
              createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              status: "pending",
            },
            {
              id: "report-2",
              secretId: "mock-report-1",
              reason: "This violates community guidelines",
              username: "SafetyFirst456",
              createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              status: "pending",
            },
          ],
          reportCount: 2,
        },
      ]
    }

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

