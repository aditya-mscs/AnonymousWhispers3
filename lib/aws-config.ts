import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { getAwsCredentials, logAwsConfig } from "./aws-env"

// Log AWS configuration on startup
const awsEnv = logAwsConfig()

// Initialize the DynamoDB client with environment variables
const client = new DynamoDBClient({
  region: awsEnv.region,
  credentials: getAwsCredentials(),
})

// Create a document client for easier interaction with DynamoDB
export const docClient = DynamoDBDocumentClient.from(client)

// Export table names
export const SECRETS_TABLE = awsEnv.secretsTable
export const COMMENTS_TABLE = awsEnv.commentsTable

// Helper function to check if AWS configuration is valid
export async function checkAwsConfig() {
  try {
    // Try to validate the credentials by making a simple request
    const { STSClient, GetCallerIdentityCommand } = await import("@aws-sdk/client-sts")

    const stsClient = new STSClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const command = new GetCallerIdentityCommand({})
    const response = await stsClient.send(command)

    return {
      valid: true,
      region: awsEnv.region,
      hasCredentials: awsEnv.hasCredentials,
      secretsTable: awsEnv.secretsTable,
      commentsTable: awsEnv.commentsTable,
      identity: {
        account: response.Account,
        arn: response.Arn,
      },
    }
  } catch (error) {
    console.error("AWS config validation error:", error)
    return {
      valid: false,
      region: awsEnv.region,
      hasCredentials: awsEnv.hasCredentials,
      secretsTable: awsEnv.secretsTable,
      commentsTable: awsEnv.commentsTable,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

