import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"

// Log AWS configuration on startup
console.log("AWS Config:", {
  region: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  secretsTable: process.env.SECRETS_TABLE,
  commentsTable: process.env.COMMENTS_TABLE,
})

// Initialize the DynamoDB client with environment variables
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
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
export async function checkAwsConfig() {
  try {
    // Try to validate the credentials by making a simple request
    const { STSClient, GetCallerIdentityCommand } = await import("@aws-sdk/client-sts")

    const stsClient = new STSClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    })

    const command = new GetCallerIdentityCommand({})
    const response = await stsClient.send(command)

    return {
      valid: true,
      region: process.env.AWS_REGION,
      hasCredentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      secretsTable: SECRETS_TABLE,
      commentsTable: COMMENTS_TABLE,
      identity: {
        account: response.Account,
        arn: response.Arn,
      },
    }
  } catch (error) {
    console.error("AWS config validation error:", error)
    return {
      valid: false,
      region: process.env.AWS_REGION,
      hasCredentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      secretsTable: SECRETS_TABLE,
      commentsTable: COMMENTS_TABLE,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

