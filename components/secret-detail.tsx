"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Share2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import type { Secret } from "@/types/secret"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { getUsernameFromStorage, getUserRating, saveUserRating } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface SecretDetailProps {
  secret: Secret
}

export function SecretDetail({ secret }: SecretDetailProps) {
  const [comment, setComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [tempRating, setTempRating] = useState(0)
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

  // Handle comment submission
  const commentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const username = getUsernameFromStorage()

      const response = await fetch(`/api/secrets/${secret.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: commentText,
          username,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add comment")
      }

      return response.json()
    },
    onSuccess: () => {
      setComment("")
      toast({
        title: "Comment added",
        description: "Your comment has been added to the secret.",
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["secret", secret.id] })
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleCommentSubmit = () => {
    if (comment.trim().length < 3) {
      toast({
        title: "Comment too short",
        description: "Your comment must be at least 3 characters long.",
        variant: "destructive",
      })
      return
    }

    commentMutation.mutate(comment)
  }

  // Handle rating change during sliding (visual only) - NO SERVICE CALL
  const handleRatingChange = (value: number[]) => {
    setTempRating(value[0])
  }

  // Handle rating change when sliding is complete (save to localStorage) - SERVICE CALL
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

  // Handle share button click
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
      fetch(`/api/secrets/${secret.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "share" }),
      }).catch(console.error)
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{secret.username}</div>
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
            </div>
            <div className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              Darkness: {secret.darkness}/10
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg whitespace-pre-wrap">{secret.content}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Your darkness rating</span>
              <span className="font-medium">{tempRating}/10</span>
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
            <div className={cn("h-2 w-full rounded-full overflow-hidden mt-1", "bg-gray-200 dark:bg-gray-700")}>
              <div
                className={cn("h-full transition-all duration-200", getSliderColor(tempRating))}
                style={{ width: `${tempRating * 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Comments ({secret.comments?.length || 0})</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleCommentSubmit} disabled={comment.trim().length < 3 || commentMutation.isPending}>
              {commentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>

          {secret.comments && secret.comments.length > 0 ? (
            <div className="space-y-4 mt-6">
              {secret.comments.map((comment, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{comment.username}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">No comments yet. Be the first to comment!</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

