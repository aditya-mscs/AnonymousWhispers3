import type { Secret } from "@/types/secret"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

// Get AWS environment variables
const awsEnv = getAwsEnvironment()

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: awsEnv.region,
  credentials: getAwsCredentials(),
})

const docClient = DynamoDBDocumentClient.from(client)

// Table name for storing social media credentials
const SOCIAL_CONFIG_TABLE = "anonymous-dark-secrets-config"

// Get social media credentials from DynamoDB
async function getSocialMediaCredentials() {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: SOCIAL_CONFIG_TABLE,
        Key: { configId: "social-media-credentials" },
      }),
    )

    return (
      result.Item?.credentials || {
        twitter: { apiKey: "", apiSecret: "", accessToken: "", accessSecret: "" },
        instagram: { accessToken: "" },
      }
    )
  } catch (error) {
    console.error("Error fetching social media credentials:", error)
    return {
      twitter: { apiKey: "", apiSecret: "", accessToken: "", accessSecret: "" },
      instagram: { accessToken: "" },
    }
  }
}

// Criteria for determining if a secret qualifies for social sharing
export function qualifiesForSocialSharing(secret: Secret): boolean {
  // Criteria:
  // 1. Content length is substantial (at least 100 characters)
  // 2. Has a darkness rating of at least 6 (more engaging content)
  // 3. No explicit content markers (would need more sophisticated content filtering in production)

  const hasSubstantialContent = secret.content.length >= 100
  const hasEngagingDarkness = secret.darkness >= 6

  return hasSubstantialContent && hasEngagingDarkness
}

// Function to post to Twitter/X
export async function postToTwitter(secret: Secret): Promise<boolean> {
  try {
    // Create a shareable URL for the secret
    const secretUrl = `/secret/${secret.id}`

    // Get Twitter credentials from DynamoDB
    const credentials = await getSocialMediaCredentials()
    const twitterCredentials = credentials.twitter

    // Check if we have valid Twitter credentials
    if (
      !twitterCredentials.apiKey ||
      !twitterCredentials.apiSecret ||
      !twitterCredentials.accessToken ||
      !twitterCredentials.accessSecret
    ) {
      console.log("Missing Twitter credentials, using environment variables as fallback")

      // Fall back to environment variables if available
      if (
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET
      ) {
        // Use environment variables for Twitter API
        const response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `OAuth oauth_consumer_key="${process.env.TWITTER_API_KEY}",oauth_token="${process.env.TWITTER_ACCESS_TOKEN}"`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `"${truncateText(secret.content, 250)}" - Anonymous Darkness Rating: ${secret.darkness}/10 ${secretUrl}`,
          }),
        })

        // Check if the request was successful
        return response.ok
      } else {
        // Mock implementation for development/testing
        console.log(`[MOCK] Posted to Twitter: "${truncateText(secret.content, 250)}" - Anonymous`)
        return true
      }
    }

    // Use stored credentials for Twitter API
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `OAuth oauth_consumer_key="${twitterCredentials.apiKey}",oauth_token="${twitterCredentials.accessToken}"`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `"${truncateText(secret.content, 250)}" - Anonymous Darkness Rating: ${secret.darkness}/10 ${secretUrl}`,
      }),
    })

    // Check if the request was successful
    return response.ok
  } catch (error) {
    console.error("Error posting to Twitter:", error)
    return false
  }
}

export async function postToInstagram(secret: Secret): Promise<boolean> {
  try {
    // Create a shareable URL for the secret
    const secretUrl = `/secret/${secret.id}`

    // Get Instagram credentials from DynamoDB
    const credentials = await getSocialMediaCredentials()
    const instagramCredentials = credentials.instagram

    // Check if we have valid Instagram credentials
    if (!instagramCredentials.accessToken) {
      console.log("Missing Instagram credentials, using environment variables as fallback")

      // Fall back to environment variables if available
      if (process.env.INSTAGRAM_ACCESS_TOKEN) {
        // Generate an image with the secret text (would use a service like Cloudinary or similar)
        const imageUrl = `https://via.placeholder.com/1080x1080.png?text=${encodeURIComponent(truncateText(secret.content, 100))}`

        // Post to Instagram with the image
        const caption = `"${truncateText(secret.content, 200)}" - Anonymous Darkness Rating: ${secret.darkness}/10 #AnonymousSecrets #Confessions`

        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`,
          {
            method: "POST",
          },
        )

        // Check if the request was successful
        return response.ok
      } else {
        // Mock implementation for development/testing
        console.log(`[MOCK] Posted to Instagram: "${truncateText(secret.content, 200)}" - Anonymous`)
        return true
      }
    }

    // Generate an image with the secret text (would use a service like Cloudinary or similar)
    const imageUrl = `https://via.placeholder.com/1080x1080.png?text=${encodeURIComponent(truncateText(secret.content, 100))}`

    // Post to Instagram with the image
    const caption = `"${truncateText(secret.content, 200)}" - Anonymous Darkness Rating: ${secret.darkness}/10 #AnonymousSecrets #Confessions`

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${instagramCredentials.accessToken}`,
      {
        method: "POST",
      },
    )

    // Check if the request was successful
    return response.ok
  } catch (error) {
    console.error("Error posting to Instagram:", error)
    return false
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

