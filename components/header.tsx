"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Menu, X, UserRound, Edit } from "lucide-react"
import { useState, useEffect } from "react"
import { getOrCreateUsername } from "@/lib/storage"
import { UsernameDialog } from "@/components/username-dialog"

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false)

  // Add useEffect to get or create username on mount
  useEffect(() => {
    const storedUsername = getOrCreateUsername()
    setUsername(storedUsername)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername)
  }

  return (
    <>
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-xl">
              Anonymous Dark Secrets
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/about" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            {username && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                  <UserRound className="h-3 w-3" />
                  {username}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsUsernameDialogOpen(true)}>
                  <Edit className="h-3.5 w-3.5" />
                  <span className="sr-only">Change username</span>
                </Button>
              </div>
            )}
            <ModeToggle />
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <div className="font-bold text-xl">Menu</div>
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="container grid gap-6 py-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-medium" onClick={toggleMenu}>
              Home
            </Link>
            <Link href="/about" className="flex items-center gap-2 text-lg font-medium" onClick={toggleMenu}>
              About
            </Link>
            {username && (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-medium">
                  Your username: <span className="text-primary">{username}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsUsernameDialogOpen(true)
                    setIsMenuOpen(false)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change Username
                </Button>
              </div>
            )}
            <div className="flex items-center">
              <ModeToggle />
              <span className="ml-2">Toggle light/dark</span>
            </div>
          </nav>
        </div>
      )}

      <UsernameDialog
        open={isUsernameDialogOpen}
        onOpenChange={setIsUsernameDialogOpen}
        currentUsername={username}
        onUsernameChange={handleUsernameChange}
      />
    </>
  )
}

