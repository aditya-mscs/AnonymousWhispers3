import type { Secret, Comment } from "@/types/secret"

// API client for secrets
export const secretsApi = {
  // Get all secrets
  getSecrets: async (type = "recent", limit = 10, page = 1): Promise<Secret[]> => {
    const response = await fetch(`/api/secrets?type=${type}&limit=${limit}&page=${page}`)
    if (!response.ok) {
      throw new Error("Failed to fetch secrets")
    }
    const data = await response.json()
    return data.secrets
  },

  // Get a single secret by ID
  getSecretById: async (id: string): Promise<Secret> => {
    const response = await fetch(`/api/secrets/${id}`)
    if (!response.ok) {
      throw new Error("Failed to fetch secret")
    }
    const data = await response.json()
    return data.secret
  },

  // Create a new secret
  createSecret: async (secret: { content: string; darkness: number; username?: string }): Promise<Secret> => {
    const response = await fetch("/api/secrets", {
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
}

