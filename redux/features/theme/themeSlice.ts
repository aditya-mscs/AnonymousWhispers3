import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ThemeMode = "light" | "dark" | "system"

interface ThemeState {
  mode: ThemeMode
}

// Initialize from localStorage if available, otherwise default to dark
const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme") as ThemeMode
    if (savedTheme) {
      return savedTheme
    }
  }
  return "dark"
}

const initialState: ThemeState = {
  mode: getInitialTheme(),
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", action.payload)
      }
    },
  },
})

export const { setTheme } = themeSlice.actions

export default themeSlice.reducer

