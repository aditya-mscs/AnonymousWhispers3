import type { Secret, Comment } from "@/types/secret"

// Helper function to get the base URL
function getBaseUrl() {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // For server-side rendering, use environment variables or default
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}

// API client for secrets
export const secretsApi = {
  // Get all secrets
  getSecrets: async (type = "recent", limit = 10, page = 1): Promise<Secret[]> => {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/secrets?type=${type}&limit=${limit}&page=${page}`)
    if (!response.ok) {
      throw new Error("Failed to fetch secrets")
    }
    const data = await response.json()
    return data.secrets
  },

  // Get a single secret by ID
  getSecretById: async (id: string): Promise<Secret> => {
    console.log(`API Client: Fetching secret with ID: ${id}`)

    // Use absolute URL to avoid parsing issues
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}/api/secrets/${id}`
    console.log(`API Client: Using URL: ${url}`)

    const response = await fetch(url, {
      // Add cache: 'no-store' to prevent caching issues
      cache: "no-store",
    })

    console.log(`API Client: Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Client: Error response: ${errorText}`)
      throw new Error(`Failed to fetch secret: ${response.statusText}. Details: ${errorText}`)
    }

    const data = await response.json()
    console.log(`API Client: Received data with secret:`, data.secret ? "found" : "not found")

    return data.secret
  },

  // Create a new secret
  createSecret: async (secret: { content: string; darkness: number; username?: string }): Promise<Secret> => {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/secrets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(secret),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create secret")
    }
    const data = await response.json()
    return data.secret
  },

  // Add a comment to a secret
  addComment: async (secretId: string, comment: { content: string; username: string }): Promise<Comment> => {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/secrets/${secretId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: comment.content,
        username: comment.username,
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to add comment")
    }
    const data = await response.json()
    return data.comment
  },

  // Update secret interactions (share, view)
  updateInteractions: async (secretId: string, action: "share" | "view"): Promise<Secret> => {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/secrets/${secretId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    })
    if (!response.ok) {
      throw new Error("Failed to update interactions")
    }
    const data = await response.json()
    return data.result
  },
}

