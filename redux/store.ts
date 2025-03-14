import { configureStore } from "@reduxjs/toolkit"
import secretsReducer from "./features/secrets/secretsSlice"

/**
 * Redux store configuration
 * Centralizes application state management
 */
export const store = configureStore({
  reducer: {
    secrets: secretsReducer,
    // Other reducers can be added here as needed
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== "production",
})

// Type definitions for TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

