"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";


/**
 * Theme provider component
 * Manages light/dark theme for the application
 */
export function MyAppThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

