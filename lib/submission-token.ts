export function generateSubmissionToken(): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 10)
  const token = `${timestamp}.${randomPart}`

  // In a real implementation, you might sign this token with a secret key
  return btoa(token) // Base64 encode
}

/**
 * Validates a submission token
 * @param token The token to validate
 * @param maxAgeMs Maximum age of the token in milliseconds
 * @returns True if the token is valid and not expired
 */
export function validateSubmissionToken(token: string, maxAgeMs = 5 * 60 * 1000): boolean {
  try {
    // Decode the token
    const decoded = atob(token)
    const [timestampStr] = decoded.split(".")

    // Parse the timestamp
    const timestamp = Number.parseInt(timestampStr, 10)
    const now = Date.now()

    // Check if the token is expired
    return !isNaN(timestamp) && now - timestamp < maxAgeMs
  } catch (error) {
    return false
  }
}

