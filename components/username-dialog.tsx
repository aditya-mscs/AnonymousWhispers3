"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Using a regular HTML label instead of the Radix UI component
import { useToast } from "@/hooks/use-toast"
import { saveUsernameToStorage } from "@/lib/storage"
import { generateRandomUsername } from "@/lib/utils"

interface UsernameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUsername: string
  onUsernameChange: (username: string) => void
}

export function UsernameDialog({ open, onOpenChange, currentUsername, onUsernameChange }: UsernameDialogProps) {
  const [username, setUsername] = useState(currentUsername)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (username.trim().length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      })
      return
    }

    // Save to localStorage
    saveUsernameToStorage(username)

    // Update parent component
    onUsernameChange(username)

    // Show success toast
    toast({
      title: "Username updated",
      description: "Your username has been successfully updated.",
      variant: "success",
    })

    // Close dialog
    onOpenChange(false)
  }

  const generateNewUsername = () => {
    const newUsername = generateRandomUsername()
    setUsername(newUsername)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Username</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a new username"
              />
            </div>
            <Button type="button" variant="outline" onClick={generateNewUsername} className="w-full">
              Generate Random Username
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

