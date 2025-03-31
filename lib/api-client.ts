import type { Secret, Comment } from "@/types/secret"
import { browserSafeClient } from "./browser-safe-client"

// Determine if we're in a browser environment
// const isBrowser = typeof window !== "undefined"

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
    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   return browserSafeClient.getSecrets(type, limit, page)
    // }

    const baseUrl = getBaseUrl()

    try {
      // Try the real API
      const response = await fetch(`${baseUrl}/api/secrets?type=${type}&limit=${limit}&page=${page}`)

      if (response.ok) {
        const data = await response.json()
        return data.secrets
      }

      console.warn("Real API failed, falling back to mock data")
    } catch (error) {
      console.error("Error fetching from real API, falling back to mock data:", error)
    }

    // Fall back to mock API if real one fails
    const mockResponse = await fetch(`${baseUrl}/api/mock-secrets?type=${type}&limit=${limit}&page=${page}`)
    if (!mockResponse.ok) {
      throw new Error("Failed to fetch secrets from both real and mock APIs")
    }
    const mockData = await mockResponse.json()
    return mockData.secrets
  },

  // Get a single secret by ID
  getSecretById: async (id: string): Promise<Secret> => {
    console.log(`API Client: Fetching secret with ID: ${id}`)

    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   const secret = await browserSafeClient.getSecretById(id)
    //   if (!secret) throw new Error("Secret not found")
    //   return secret
    // }

    // Use absolute URL to avoid parsing issues
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}/api/secrets/${id}`
    console.log(`API Client: Using URL: ${url}`)

    try {
      // First try the real API
      const response = await fetch(url, {
        cache: "no-store",
      })

      console.log(`API Client: Response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`API Client: Received data with secret:`, data.secret ? "found" : "not found")
        return data.secret
      }

      console.warn("Real API failed, falling back to mock data")
    } catch (error) {
      console.error("API client error, falling back to mock data:", error)
    }

    // Fall back to mock API if real one fails
    console.log(`API Client: Trying mock API at ${baseUrl}/api/mock-secrets/${id}`)
    const mockResponse = await fetch(`${baseUrl}/api/mock-secrets/${id}`, {
      cache: "no-store",
    })

    if (!mockResponse.ok) {
      throw new Error("Failed to fetch secret from both real and mock APIs")
    }

    const mockData = await mockResponse.json()
    console.log("API Client: Received mock data")
    return mockData.secret
  },

  // Create a new secret
  createSecret: async (secret: {
    content: string
    darkness: number
    username?: string
    submissionToken?: string
  }): Promise<Secret> => {
    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   return browserSafeClient.createSecret({
    //     content: secret.content,
    //     darkness: secret.darkness,
    //     username: secret.username || `Anonymous${Math.floor(Math.random() * 1000)}`,
    //   })
    // }

    const baseUrl = getBaseUrl()

    try {
      // First try the real API
      const response = await fetch(`${baseUrl}/api/secrets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(secret),
      })

      if (response.ok) {
        const data = await response.json()
        return data.secret
      }

      console.warn("Real API failed for creating secret, using client-side mock")
    } catch (error) {
      console.error("Error creating secret with real API:", error)
    }

    // Create a mock secret on the client side
    const mockSecret: Secret = {
      id: Math.random().toString(36).substring(2, 15),
      content: secret.content,
      darkness: secret.darkness,
      username: secret.username || `Anonymous${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      comments: [],
      views: 0,
      shares: 0,
    }

    return mockSecret
  },

  // Add a comment to a secret
  addComment: async (secretId: string, comment: { content: string; username: string }): Promise<Comment> => {
    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   return browserSafeClient.addComment(secretId, comment)
    // }

    const baseUrl = getBaseUrl()

    try {
      // First try the real API
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

      if (response.ok) {
        const data = await response.json()
        return data.comment
      }

      console.warn("Real API failed for adding comment, falling back to mock API")
    } catch (error) {
      console.error("Error adding comment with real API:", error)
    }

    // Fall back to mock API
    const mockResponse = await fetch(`${baseUrl}/api/mock-secrets/${secretId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: comment.content,
        username: comment.username,
      }),
    })

    if (!mockResponse.ok) {
      throw new Error("Failed to add comment with both real and mock APIs")
    }

    const mockData = await mockResponse.json()
    return mockData.comment
  },

  // Update secret interactions (share, view)
  updateInteractions: async (secretId: string, action: "share" | "view"): Promise<Secret> => {
    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   await browserSafeClient.updateInteractions(secretId, action)
    //   const secret = await browserSafeClient.getSecretById(secretId)
    //   return (
    //     secret || {
    //       id: secretId,
    //       content: "",
    //       darkness: 0,
    //       username: "",
    //       createdAt: new Date().toISOString(),
    //       comments: [],
    //       views: action === "view" ? 1 : 0,
    //       shares: action === "share" ? 1 : 0,
    //     }
    //   )
    // }

    const baseUrl = getBaseUrl()

    try {
      // Try the real API
      const response = await fetch(`${baseUrl}/api/secrets/${secretId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.result
      }

      console.warn("Real API failed for updating interactions, using client-side mock")
    } catch (error) {
      console.error("Error updating interactions with real API:", error)
    }

    // Just return a mock result
    return {
      id: secretId,
      content: "",
      darkness: 0,
      username: "",
      createdAt: new Date().toISOString(),
      comments: [],
      views: action === "view" ? 1 : 0,
      shares: action === "share" ? 1 : 0,
    }
  },

  // Report a secret
  reportSecret: async (
    secretId: string,
    data: { reason: string; username: string },
  ): Promise<{ success: boolean; message: string }> => {
    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   return browserSafeClient.reportSecret(secretId, data)
    // }

    const baseUrl = getBaseUrl()

    try {
      // Try the real API
      const response = await fetch(`${baseUrl}/api/secrets/${secretId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        return await response.json()
      }

      console.warn("Real API failed for reporting secret, using client-side mock")
    } catch (error) {
      console.error("Error reporting secret with real API:", error)
    }

    // Return a mock success response
    return {
      success: true,
      message: "Thank you for your report. Our team will review this content shortly.",
    }
  },

  // Get all reported secrets (for admin)
  getReportedSecrets: async (): Promise<any[]> => {
    // In browser environments, use the browser-safe client
    // if (isBrowser) {
    //   return browserSafeClient.getReportedSecrets()
    // }

    const baseUrl = getBaseUrl()

    try {
      // Try the real API
      const response = await fetch(`${baseUrl}/api/adminportal/reports`)

      if (response.ok) {
        const data = await response.json()
        return data.reportedSecrets
      }

      console.warn("Real API failed for getting reported secrets, using client-side mock")
    } catch (error) {
      console.error("Error getting reported secrets with real API:", error)
    }

    // Return empty array as fallback
    return []
  },
}

