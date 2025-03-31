import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Secret, Comment } from "@/types/secret"

interface SecretsState {
  hasSharedSecret?: boolean
  secrets: Secret[]
  loading: boolean
  error: string | null
}

const initialState: SecretsState = {
  hasSharedSecret: false,
  secrets: [],
  loading: false,
  error: null,
}

export const secretsSlice = createSlice({
  name: "secrets",
  initialState,
  reducers: {
    setSecrets: (state, action: PayloadAction<Secret[]>) => {
      // Merge with existing secrets, avoiding duplicates
      const existingIds = new Set(state.secrets.map((s) => s.id))
      const newSecrets = action.payload.filter((s) => !existingIds.has(s.id))
      state.secrets = [...state.secrets, ...newSecrets]
    },
    addSecret: (state, action: PayloadAction<Secret>) => {
      // Check if secret already exists
      const exists = state.secrets.some((s) => s.id === action.payload.id)
      if (!exists) {
        state.secrets.unshift(action.payload)
      }
    },
    addComment: (state, action: PayloadAction<{ secretId: string; comment: Comment }>) => {
      const { secretId, comment } = action.payload
      const secret = state.secrets.find((s) => s.id === secretId)
      if (secret) {
        if (!secret.comments) {
          secret.comments = []
        }
        secret.comments.push(comment)
      }
    },
    updateSecretInteractions: (state, action: PayloadAction<{ secretId: string; action: "share" | "view" }>) => {
      const { secretId, action: interactionType } = action.payload
      const secret = state.secrets.find((s) => s.id === secretId)
      if (secret) {
        if (interactionType === "share") {
          secret.shares = (secret.shares || 0) + 1
        } else if (interactionType === "view") {
          secret.views = (secret.views || 0) + 1
        }
      }
    },
  },
})

export const { setSecrets, addSecret, addComment, updateSecretInteractions } = secretsSlice.actions

export default secretsSlice.reducer

