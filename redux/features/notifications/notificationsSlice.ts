import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface NotificationsState {
  hasPostedComment: boolean
}

// Initialize from sessionStorage if available
const getInitialHasPostedComment = (): boolean => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("has_posted_comment") === "true"
  }
  return false
}

const initialState: NotificationsState = {
  hasPostedComment: getInitialHasPostedComment(),
}

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setHasPostedComment: (state, action: PayloadAction<boolean>) => {
      state.hasPostedComment = action.payload
      if (typeof window !== "undefined") {
        sessionStorage.setItem("has_posted_comment", action.payload.toString())
      }
    },
  },
})

export const { setHasPostedComment } = notificationsSlice.actions

export default notificationsSlice.reducer

