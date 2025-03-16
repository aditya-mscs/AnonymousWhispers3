import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "./aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Create a mock client for environments where AWS SDK isn't fully supported
const createMockClient = () => {
  return {
    send: async () => {
      console.log("Using mock DynamoDB client")
      return { Items: [], Count: 0 }
    },
  }
}

// Create the client with error handling
let docClient
try {
  // Create the DynamoDB client
  const client = new DynamoDBClient({
    region: awsEnv.region,
    credentials: getAwsCredentials(),
    // Disable credential loading from shared ini file
    credentialDefaultProvider: () => async () => {
      return { accessKeyId: awsEnv.accessKeyId, secretAccessKey: awsEnv.secretAccessKey }
    },
  })

  // Create the document client
  docClient = DynamoDBDocumentClient.from(client)
} catch (error) {
  console.error("Error creating DynamoDB client:", error)
  // Provide a mock client that won't throw errors
  docClient = createMockClient()
}

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

