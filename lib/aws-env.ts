/**
 * Centralized utility for accessing AWS environment variables
 * Only uses MY_AWS_* variables to avoid Amplify restrictions
 */

export interface AwsEnvironment {
  // AWS credentials and region
  region: string
  accessKeyId: string
  secretAccessKey: string

  // DynamoDB table names
  secretsTable: string
  commentsTable: string

  // Other AWS-related environment variables
  ipHashSalt: string

  // Application URLs
  baseUrl: string

  // Helper properties
  hasCredentials: boolean
}

/**
 * Get all AWS environment variables
 * Safe to use in both server and client components
 */
export function getAwsEnvironment(): AwsEnvironment {
  // Use typeof check to ensure this works in both server and client environments
  const env = typeof process !== "undefined" && process.env ? process.env : {}

  // Get region - only use MY_AWS_REGION
  const region = env.MY_AWS_REGION || env.AWS_REGION || "us-east-1"

  // Get credentials - only use MY_AWS_* variables
  const accessKeyId = env.MY_AWS_ACCESS_KEY || env.AWS_ACCESS_KEY_ID || ""
  const secretAccessKey = env.MY_AWS_SECRET_KEY || env.AWS_SECRET_ACCESS_KEY || ""

  // Get table names
  const secretsTable = env.SECRETS_TABLE || "anonymous-dark-secrets"
  const commentsTable = env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

  // Get other AWS-related variables
  const ipHashSalt = env.IP_HASH_SALT || "default-salt"

  // Get application URLs
  const baseUrl =
    env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

  // Check if we have valid credentials
  const hasCredentials = Boolean(accessKeyId && secretAccessKey)

  return {
    region,
    accessKeyId,
    secretAccessKey,
    secretsTable,
    commentsTable,
    ipHashSalt,
    baseUrl,
    hasCredentials,
  }
}

/**
 * Get AWS SDK credential configuration
 * Should only be used in server components or API routes
 */
export function getAwsCredentials() {
  const { accessKeyId, secretAccessKey, hasCredentials } = getAwsEnvironment()

  // IMPORTANT: Always return an object with credentials, even if empty
  // This prevents the SDK from trying to load credentials from the filesystem
  return {
    accessKeyId,
    secretAccessKey,
  }
}

/**
 * Log AWS configuration (safe for logging - no secrets)
 * Should only be used in server components or API routes
 */
export function logAwsConfig() {
  const env = getAwsEnvironment()

  console.log("AWS Config:", {
    region: env.region,
    hasCredentials: env.hasCredentials,
    secretsTable: env.secretsTable,
    commentsTable: env.commentsTable,
    baseUrl: env.baseUrl,
  })

  return env
}

