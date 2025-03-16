"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Share2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import SecretSlide from "@/components/secret-slide"
import type { Secret } from "@/types/secret"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserRating, saveUserRating } from "@/lib/storage"
import { SuperToast } from "@/components/super-toast"
import { getDarknessTextColor } from "@/lib/utils"
import SecretActionsMenu from "@/components/secret-actions-menu"
import { secretsApi } from "@/lib/api"
import { DarknessSlider } from "@/components/darkness-slider"

interface SecretCardProps {
  secret: Secret
}

/**
 * Secret card component
 * Displays a secret with rating, comments, and sharing functionality
 */
export default function SecretCard({ secret }: SecretCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [tempRating, setTempRating] = useState(0)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Format the date
  const formattedDate = formatDistanceToNow(new Date(secret.createdAt), { addSuffix: true })

  // Load user rating from localStorage on mount
  useEffect(() => {
    const savedRating = getUserRating(secret.id)
    setUserRating(savedRating)
    setTempRating(savedRating)
  }, [secret.id])

  // Handle share button click
  const shareMutation = useMutation({
    mutationFn: () => secretsApi.updateInteractions(secret.id, "share"),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["secrets"] })
      queryClient.invalidateQueries({ queryKey: ["secret", secret.id] })
    },
  })

  /**
   * Handles sharing a secret
   * Uses Web Share API if available, otherwise copies to clipboard
   */
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/secret/${secret.id}`

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: "Anonymous Whispers 🤫",
          text: "Check out this anonymous whisper",
          url: shareUrl,
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        SuperToast.show({
          message: "Secret link copied to clipboard!",
          type: "success",
        })
      }

      // Update share count in the background
      shareMutation.mutate()
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  /**
   * Opens the secret detail dialog
   */
  const handleContentClick = () => {
    setIsDialogOpen(true)
  }

  /**
   * Updates the visual slider without saving
   * No service call is made here
   */
  const handleRatingChange = (value: number[]) => {
    setTempRating(value[0])
  }

  /**
   * Saves the rating when the user finishes sliding
   * Service call is made here
   */
  const handleRatingChangeEnd = (value: number[]) => {
    const newRating = value[0]
    setUserRating(newRating)

    // Save to localStorage - this is the only place we make a "service call"
    saveUserRating(secret.id, newRating)

    SuperToast.show({
      message: `You rated this secret ${newRating}/10 for darkness.`,
      type: "success",
    })
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <div>
            <div className="font-medium text-sm">{secret.username}</div>
            <div className="text-xs text-muted-foreground">{formattedDate}</div>
          </div>
          <div className={`px-2 py-1 ${getDarknessTextColor(secret.darkness)} bg-primary/10 text-xs rounded-full`}>
            Darkness: {secret.darkness}/10
          </div>
        </CardHeader>
        <CardContent className="flex-grow" onClick={handleContentClick}>
          <p className="line-clamp-6 cursor-pointer hover:text-primary transition-colors">{secret.content}</p>
        </CardContent>
        <CardFooter className="pt-2 flex flex-col gap-2">
          <div className="w-full">
            <DarknessSlider
              value={[tempRating]}
              onValueChange={handleRatingChange} // Visual update only
              onValueCommit={handleRatingChangeEnd} // Save only when finished
            />
          </div>
          <div className="flex justify-between w-full">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleContentClick}>
              <MessageSquare className="h-4 w-4 mr-1" />
              {secret.comments?.length || 0}
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <SecretActionsMenu secretId={secret.id} />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Secret detail slide panel */}
      <SecretSlide
        secret={secret}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userRating={userRating}
        onRatingChange={handleRatingChange}
        onRatingChangeEnd={handleRatingChangeEnd}
      />
    </>
  )
}

