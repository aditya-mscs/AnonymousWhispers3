import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import { Providers } from "@/redux/providers"
import { ToastContainer } from "@/components/super-toast"

// Load Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] })

// Metadata for the application
export const metadata: Metadata = {
  title: "Anonymous Whispers 🤫",
  description: "Share your secrets anonymously in a safe space without judgment",
}

/**
 * Root layout component
 * Wraps the entire application with providers and layout elements
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            <div className="min-h-screen bg-background">
              <Header />
              <main className="container mx-auto px-4 py-6">{children}</main>
              <ToastContainer />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

