import type { Secret } from "@/types/secret"

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
    // Don't use baseUrl, use a relative path or window.location.origin if needed
    const secretUrl = `/secret/${secret.id}`

    // In a real implementation, you would use the Twitter API
    // This would require proper authentication and API keys

    // Example of what the API call might look like:
    // const response = await fetch('https://api.twitter.com/2/tweets', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.TWITTER_API_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     text: `"${truncateText(secret.content, 250)}" - Anonymous Darkness Rating: ${secret.darkness}/10 ${secretUrl}`
    //   })
    // })

    console.log(`[MOCK] Posted to Twitter: "${truncateText(secret.content, 250)}" - Anonymous`)
    return true
  } catch (error) {
    console.error("Error posting to Twitter:", error)
    return false
  }
}

export async function postToInstagram(secret: Secret): Promise<boolean> {
  try {
    // Don't use baseUrl, use a relative path or window.location.origin if needed
    const secretUrl = `/secret/${secret.id}`

    // In a real implementation, you would use the Facebook Graph API for Instagram
    // This would require proper authentication and API keys

    // Example of what the API call might look like:
    // const response = await fetch(`https://graph.facebook.com/v18.0/me/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`, {
    //   method: 'POST'
    // })

    console.log(`[MOCK] Posted to Instagram: "${truncateText(secret.content, 200)}" - Anonymous`)
    return true
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

