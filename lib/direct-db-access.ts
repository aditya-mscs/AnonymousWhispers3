import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Create a document client for easier interaction with DynamoDB
const docClient = DynamoDBDocumentClient.from(client)

// Table names
const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

// Function to directly get a secret by ID
export async function directGetSecretById(id: string) {
  try {
    console.log("Direct DB: Fetching secret with ID:", id)
    console.log("Direct DB: Using table:", SECRETS_TABLE)

    const result = await docClient.send(
      new GetCommand({
        TableName: SECRETS_TABLE,
        Key: { id },
      }),
    )

    console.log("Direct DB: Result:", result)

    if (!result.Item) {
      console.log("Direct DB: Secret not found")
      return null
    }

    // Get comments for this secret
    const commentsResult = await docClient.send(
      new QueryCommand({
        TableName: COMMENTS_TABLE,
        IndexName: "SecretIdIndex",
        KeyConditionExpression: "secretId = :secretId",
        ExpressionAttributeValues: {
          ":secretId": id,
        },
      }),
    )

    console.log("Direct DB: Comments result:", commentsResult)

    const comments = commentsResult.Items || []

    return {
      ...result.Item,
      comments,
    }
  } catch (error) {
    console.error("Direct DB: Error fetching secret:", error)
    throw error
  }
}

// Function to check if tables exist and are accessible
export async function checkTablesExist() {
  try {
    const secretsResult = await docClient.send(
      new GetCommand({
        TableName: SECRETS_TABLE,
        Key: { id: "test-id" },
      }),
    )

    const commentsResult = await docClient.send(
      new QueryCommand({
        TableName: COMMENTS_TABLE,
        IndexName: "SecretIdIndex",
        KeyConditionExpression: "secretId = :secretId",
        ExpressionAttributeValues: {
          ":secretId": "test-id",
        },
        Limit: 1,
      }),
    )

    return {
      secretsTableAccessible: true,
      commentsTableAccessible: true,
    }
  } catch (error) {
    console.error("Error checking tables:", error)
    return {
      secretsTableAccessible: false,
      commentsTableAccessible: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

