"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Share2, MessageSquare } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { SecretDialog } from "@/components/secret-dialog"
import type { Secret } from "@/types/secret"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserRating, saveUserRating } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { secretsApi } from "@/lib/api-client"

interface SecretCardProps {
  secret: Secret
}

export default function SecretCard({ secret }: SecretCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [tempRating, setTempRating] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
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

  const handleShare = async () => {
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/secret/${secret.id}`

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: "Anonymous Dark Secret",
          text: "Check out this anonymous secret",
          url: shareUrl,
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied",
          description: "Secret link copied to clipboard!",
        })
      }

      // Update share count in the background
      shareMutation.mutate()
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleContentClick = () => {
    setIsDialogOpen(true)
  }

  // This updates the visual slider without saving - NO SERVICE CALL HERE
  const handleRatingChange = (value: number[]) => {
    setTempRating(value[0])
  }

  // This saves the rating ONLY when the user finishes sliding - SERVICE CALL HERE
  const handleRatingChangeEnd = (value: number[]) => {
    const newRating = value[0]
    setUserRating(newRating)

    // Save to localStorage - this is the only place we make a "service call"
    saveUserRating(secret.id, newRating)

    toast({
      title: "Rating saved",
      description: `You rated this secret ${newRating}/10 for darkness.`,
    })
  }

  // Get color based on rating
  const getSliderColor = (rating: number) => {
    if (rating >= 8) return "bg-red-500"
    if (rating >= 5) return "bg-amber-500"
    if (rating > 0) return "bg-green-500"
    return "bg-gray-300 dark:bg-gray-600"
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <div>
            <div className="font-medium text-sm">{secret.username}</div>
            <div className="text-xs text-muted-foreground">{formattedDate}</div>
          </div>
          <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            Darkness: {secret.darkness}/10
          </div>
        </CardHeader>
        <CardContent className="flex-grow" onClick={handleContentClick}>
          <p className="line-clamp-6 cursor-pointer hover:text-primary transition-colors">{secret.content}</p>
        </CardContent>
        <CardFooter className="pt-2 flex flex-col gap-2">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs">
              <span>Your rating: {tempRating}/10</span>
            </div>
            {/* Slider that updates visually while dragging but only saves when released */}
            <Slider
              value={[tempRating]}
              min={0}
              max={10}
              step={1}
              onValueChange={handleRatingChange} // Visual update only
              onValueCommit={handleRatingChangeEnd} // Save only when finished
              className="w-full"
            />
            {/* Color bar that changes based on rating value */}
            <div className={cn("h-1.5 w-full rounded-full overflow-hidden mt-1", "bg-gray-200 dark:bg-gray-700")}>
              <div
                className={cn("h-full transition-all duration-200", getSliderColor(tempRating))}
                style={{ width: `${tempRating * 10}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between w-full">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleContentClick}>
              <MessageSquare className="h-4 w-4 mr-1" />
              {secret.comments?.length || 0}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </CardFooter>
      </Card>

      <SecretDialog
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

