import { configureStore } from "@reduxjs/toolkit"
import secretsReducer from "./features/secrets/secretsSlice"
import themeReducer from "./features/theme/themeSlice"

export const store = configureStore({
  reducer: {
    secrets: secretsReducer,
    theme: themeReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

