import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "./aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Create the client
const client = new DynamoDBClient({
  region: awsEnv.region,
  credentials: getAwsCredentials(),
  // Disable credential loading from shared ini file
  credentialDefaultProvider: () => async () => {
    return { accessKeyId: awsEnv.accessKeyId, secretAccessKey: awsEnv.secretAccessKey }
  },
})

// Create the document client
const docClient = DynamoDBDocumentClient.from(client)

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

