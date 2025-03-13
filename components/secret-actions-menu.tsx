"use client"

import type React from "react"

import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { secretsApi } from "@/lib/api-client"
import { getUsernameFromStorage } from "@/lib/storage"
import { SuperToast } from "@/components/super-toast"

interface SecretActionsMenuProps {
  secretId: string
}

// Completely replaced the dropdown with a direct Report button
export default function SecretActionsMenu({ secretId }: SecretActionsMenuProps) {
  const [isReported, setIsReported] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReport = async (e: React.MouseEvent) => {
    // Prevent event propagation to parent elements
    e.stopPropagation()

    if (isReported || isSubmitting) return

    setIsSubmitting(true)

    try {
      const username = getUsernameFromStorage()
      const result = await secretsApi.reportSecret(secretId, {
        reason: "Reported by user", // Simple default reason
        username: username || "Anonymous",
      })

      if (result.success) {
        setIsReported(true)
        SuperToast.show({
          message: "Content reported successfully",
          type: "success",
        })
      } else {
        SuperToast.show({
          message: result.message || "Failed to report content",
          type: "error",
        })
      }
    } catch (error) {
      SuperToast.show({
        message: "An error occurred while reporting",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`${isReported ? "text-green-500" : ""}`}
      onClick={handleReport}
      disabled={isReported || isSubmitting}
    >
      <Flag className="h-4 w-4 mr-1" />
      {isReported ? "Reported" : "Report"}
    </Button>
  )
}

