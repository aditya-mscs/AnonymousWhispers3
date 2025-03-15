"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Share2, X, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import type { Secret } from "@/types/secret"
import { useMutation, useQueryClient } from "@tanstack/react-query"
// Replace useToast with SuperToast
import { SuperToast } from "@/components/super-toast"
import { getUsernameFromStorage } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface SecretDialogProps {
  secret: Secret
  open: boolean
  onOpenChange: (open: boolean) => void
  userRating: number
  onRatingChange: (value: number[]) => void
  onRatingChangeEnd: (value: number[]) => void
}

export function SecretDialog({
  secret,
  open,
  onOpenChange,
  userRating,
  onRatingChange,
  onRatingChangeEnd,
}: SecretDialogProps) {
  const [comment, setComment] = useState("")
  const [tempRating, setTempRating] = useState(userRating)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Update tempRating when userRating changes
  useEffect(() => {
    setTempRating(userRating)
  }, [userRating])

  // Format the date
  const formattedDate = formatDistanceToNow(new Date(secret.createdAt), { addSuffix: true })

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
      // Replace all instances of toast({...}) with SuperToast.show({...})
      // For example:
      // Replace:
      // toast({
      //   title: "Comment added",
      //   description: "Your comment has been added to the secret.",
      // })
      // With:
      // SuperToast.show({
      //   message: "Your comment has been added to the secret.",
      //   type: "success",
      // })
      SuperToast.show({
        message: "Your comment has been added to the secret.",
        type: "success",
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["secret", secret.id] })
      queryClient.invalidateQueries({ queryKey: ["secrets"] })
    },
    onError: (error: Error) => {
      SuperToast.show({
        message: error.message,
        type: "error",
      })
    },
  })

  const handleCommentSubmit = () => {
    if (comment.trim().length < 3) {
      SuperToast.show({
        message: "Your comment must be at least 3 characters long.",
        type: "error",
      })
      return
    }

    commentMutation.mutate(comment)
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
        SuperToast.show({
          message: "Secret link copied to clipboard!",
          type: "success",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const goToFullPage = () => {
    router.push(`/secret/${secret.id}`)
    onOpenChange(false)
  }

  // Handle rating change during sliding (visual only) - NO SERVICE CALL
  const handleLocalRatingChange = (value: number[]) => {
    setTempRating(value[0])
    onRatingChange(value)
  }

  // Get color based on rating
  const getSliderColor = (rating: number) => {
    if (rating >= 8) return "bg-red-500"
    if (rating >= 5) return "bg-amber-500"
    if (rating > 0) return "bg-green-500"
    return "bg-gray-300 dark:bg-gray-600"
  }

  // Sort comments by time (newest first)
  const sortedComments = secret.comments
    ? [...secret.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Secret from {secret.username}</span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Darkness: {secret.darkness}/10
            </div>
            <Button variant="outline" size="sm" onClick={goToFullPage}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Full Page
            </Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-md">
            <p>{secret.content}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Your rating: {tempRating}/10</span>
            </div>
            {/* Slider that updates visually while dragging but only saves when released */}
            <Slider
              value={[tempRating]}
              min={0}
              max={10}
              step={1}
              onValueChange={handleLocalRatingChange} // Visual update only
              onValueCommit={onRatingChangeEnd} // Save only when finished
              className="w-full"
              colorByValue={true}
            />
            {/* Color bar that changes based on rating value */}
            <div className={cn("h-1.5 w-full rounded-full overflow-hidden mt-1", "bg-gray-200 dark:bg-gray-700")}>
              <div
                className={cn("h-full transition-all duration-200", getSliderColor(tempRating))}
                style={{ width: `${tempRating * 10}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Comments</h4>
            {sortedComments && sortedComments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sortedComments.slice(0, 5).map((comment, index) => (
                  <div key={index} className="p-2 bg-muted/30 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                ))}
                {sortedComments.length > 5 && (
                  <Button variant="link" size="sm" onClick={goToFullPage}>
                    View all {sortedComments.length} comments
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
            />
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={comment.trim().length < 3 || commentMutation.isPending}
              >
                {commentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

