"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Using our custom Label component
import { Label } from "@/components/ui/label"
// Replace useToast with SuperToast
import { SuperToast } from "@/components/super-toast"
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
  //const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (username.trim().length < 3) {
      SuperToast.show({
        message: "Username must be at least 3 characters long.",
        type: "error",
      })
      return
    }

    // Save to localStorage
    saveUsernameToStorage(username)

    // Update parent component
    onUsernameChange(username)

    // Show success toast
    SuperToast.show({
      message: "Your username has been successfully updated.",
      type: "success",
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
              <Label
                htmlFor="username"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Username
              </Label>
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

