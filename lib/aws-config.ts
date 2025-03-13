import { logAwsConfig } from "./aws-env"
import { docClient, SECRETS_TABLE, COMMENTS_TABLE } from "./db-models"

// Log AWS configuration on startup
const awsEnv = logAwsConfig()

// Export the document client and table names
export { docClient, SECRETS_TABLE, COMMENTS_TABLE }

// Helper function to check if AWS configuration is valid
export async function checkAwsConfig() {
  try {
    // Use a simple approach that doesn't require filesystem access
    return {
      valid: Boolean(awsEnv.accessKeyId && awsEnv.secretAccessKey),
      region: awsEnv.region,
      hasCredentials: awsEnv.hasCredentials,
      secretsTable: awsEnv.secretsTable,
      commentsTable: awsEnv.commentsTable,
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

