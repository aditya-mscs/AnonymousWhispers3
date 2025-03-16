import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface NotificationsState {
  hasSharedSecret: boolean
}

// Initialize from localStorage if available
const getInitialHasSharedSecret = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("has_shared_secret") === "true"
  }
  return false
}

const initialState: NotificationsState = {
  hasSharedSecret: getInitialHasSharedSecret(),
}

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setHasSharedSecret: (state, action: PayloadAction<boolean>) => {
      state.hasSharedSecret = action.payload
      if (typeof window !== "undefined") {
        localStorage.setItem("has_shared_secret", action.payload.toString())
      }
    },
  },
})

export const { setHasSharedSecret } = notificationsSlice.actions

export default notificationsSlice.reducer

