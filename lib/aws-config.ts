import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"

// Initialize the DynamoDB client with environment variables
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined, // Use default credentials provider chain if not provided
})

// Create a document client for easier interaction with DynamoDB
export const docClient = DynamoDBDocumentClient.from(client)

// Table names
export const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
export const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

// Helper function to check if AWS configuration is valid
export function checkAwsConfig() {
  return {
    region: process.env.AWS_REGION,
    hasCredentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    secretsTable: SECRETS_TABLE,
    commentsTable: COMMENTS_TABLE,
  }
}

