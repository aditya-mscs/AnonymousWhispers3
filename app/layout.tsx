import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import { Providers } from "@/redux/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Anonymous Dark Secrets",
  description: "Share your darkest secrets anonymously in a safe space without judgment",
}

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
              <Toaster />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

