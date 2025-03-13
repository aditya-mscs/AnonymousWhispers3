import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import type { Secret } from "@/types/secret"

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

// Function to save a new secret
export async function saveSecret(secretData: Omit<Secret, "id" | "comments" | "views" | "shares">): Promise<Secret> {
  const id = uuidv4()
  const createdAt = secretData.createdAt instanceof Date ? secretData.createdAt.toISOString() : secretData.createdAt

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
          createdAt,
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
      createdAt,
      comments: [],
      views: 0,
      shares: 0,
    }
  } catch (error) {
    console.error("Error creating secret:", error)
    throw error
  }
}

// Add other functions as needed...

