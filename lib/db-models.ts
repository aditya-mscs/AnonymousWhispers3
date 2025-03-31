import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "./aws-env"
import { createMockDynamoDBClient } from "./mock-aws-client"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Determine if we're in a browser environment
// const isBrowser = typeof window !== "undefined"

// Create the appropriate client based on environment
let docClient: ReturnType<typeof DynamoDBDocumentClient.from>

// if (isBrowser) {
//   // Use mock client in browser environments
//   console.log("Using mock DynamoDB client for browser environment")
//   docClient = createMockDynamoDBClient()
// } else {
  // Use real client in server environments
  const client = new DynamoDBClient({
    region: awsEnv.region,
    credentials: getAwsCredentials(),
    // Disable credential loading from shared ini file
    credentialDefaultProvider: () => async () => {
      return { accessKeyId: awsEnv.accessKeyId, secretAccessKey: awsEnv.secretAccessKey }
    },
  })
  docClient = DynamoDBDocumentClient.from(client)
// }

// Export the document client
export { docClient }

// Export table names
export const SECRETS_TABLE = awsEnv.secretsTable || "anonymous-dark-secrets"
export const COMMENTS_TABLE = awsEnv.commentsTable || "anonymous-dark-secrets-comments"

// Export Secret and Comment interfaces (duplicated from types/secret.ts to avoid circular dependency issues)
export interface Comment {
  id: string
  content: string
  username: string
  createdAt: string
  ipHash?: string
}

export interface Secret {
  id: string
  content: string
  darkness: number
  username: string
  createdAt: string
  comments?: Comment[]
  views?: number
  shares?: number
  ipHash?: string
}

