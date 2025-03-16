import type { Secret, Comment } from "@/types/secret"

// API client for secrets
export const secretsApi = {
  // Get all secrets
  getSecrets: async (type = "recent", limit = 10, page = 1): Promise<Secret[]> => {
    try {
      console.log(`API Client: Fetching secrets with type=${type}, limit=${limit}, page=${page}`)

      const response = await fetch(`/api/secrets?type=${type}&limit=${limit}&page=${page}`)
      console.log(`API Client: Response status: ${response.status}`)

      if (!response.ok) {
        console.error(`Failed to fetch secrets: ${response.status} ${response.statusText}`)
        return [] // Return empty array instead of throwing
      }

      const data = await response.json()
      console.log(`API Client: Received ${data.secrets?.length || 0} secrets`)
      return data.secrets || [] // Ensure we always return an array
    } catch (error) {
      console.error("Error in API client getSecrets:", error)
      return [] // Return empty array on error
    }
  },

  // Get a single secret by ID
  getSecretById: async (id: string): Promise<Secret> => {
    console.log(`API Client: Fetching secret with ID: ${id}`)

    // Create a proper URL by using the window.location.origin as the base
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${baseUrl}/api/secrets/${id}`
    console.log(`API Client: Using URL: ${url}`)

    const response = await fetch(url, {
      cache: "no-store",
    })

    console.log(`API Client: Response status: ${response.status}`)

    if (!response.ok) {
      throw new Error("Failed to fetch secret")
    }

    const data = await response.json()
    console.log(`API Client: Received data with secret:`, data.secret ? "found" : "not found")
    return data.secret
  },

  // Create a new secret
  createSecret: async (secret: {
    content: string
    darkness: number
    username?: string
    submissionToken?: string
  }): Promise<Secret> => {
    const response = await fetch(`/api/secrets`, {
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
    const response = await fetch(`/api/secrets/${secretId}`, {
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
    const response = await fetch(`/api/secrets/${secretId}`, {
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

  // Report a secret
  reportSecret: async (
    secretId: string,
    data: { reason: string; username: string },
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/secrets/${secretId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to report secret")
    }

    return await response.json()
  },

  // Get all reported secrets (for admin)
  getReportedSecrets: async (): Promise<any[]> => {
    const response = await fetch(`/api/adminportal/reports`)

    if (!response.ok) {
      throw new Error("Failed to get reported secrets")
    }

    const data = await response.json()
    return data.reportedSecrets
  },
}

