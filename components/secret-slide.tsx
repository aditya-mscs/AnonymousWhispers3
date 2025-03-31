"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { SlidePanel } from "@/components/slide-panel"
import type { Secret } from "@/types/secret"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { getUsernameFromStorage } from "@/lib/storage"
import { getDarknessTextColor } from "@/lib/utils"
import SecretActionsMenu from "@/components/secret-actions-menu"

interface SecretSlideProps {
  secret: Secret
  open: boolean
  onOpenChange: (open: boolean) => void
  userRating: number
  onRatingChange: (value: number[]) => void
  onRatingChangeEnd: (value: number[]) => void
}

export default function SecretSlide({
  secret,
  open,
  onOpenChange,
  userRating,
  onRatingChange,
  onRatingChangeEnd,
}: SecretSlideProps) {
  const [comment, setComment] = useState("")
  const [tempRating, setTempRating] = useState(userRating)
  const router = useRouter()
  const { toast } = useToast()
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
      toast({
        title: "Comment added",
        description: "Your comment has been added to the secret.",
        variant: "default",
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["secret", secret.id] })
      queryClient.invalidateQueries({ queryKey: ["secrets"] })
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

  // Handle share button click
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
        toast({
          title: "Link copied",
          description: "Secret link copied to clipboard!",
          variant: "default",
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

  // Sort comments by time (newest first)
  const sortedComments = secret.comments
    ? [...secret.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  return (
    <SlidePanel open={open} onClose={() => onOpenChange(false)} title={`Secret from ${secret.username}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className={`px-2 py-1 ${getDarknessTextColor(secret.darkness)} bg-primary/10 text-xs rounded-full`}>
            Darkness: {secret.darkness}/10
          </div>
          <div className="text-xs text-muted-foreground">{formattedDate}</div>
        </div>

        <div className="p-4 bg-muted/50 rounded-md">
          <p className="whitespace-pre-wrap">{secret.content}</p>
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
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Comments</h4>
          {sortedComments && sortedComments.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedComments.map((comment, index) => (
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
            <Button
              size="sm"
              onClick={handleCommentSubmit}
              disabled={comment.trim().length < 3 || commentMutation.isLoading}
            >
              {commentMutation.isLoading ? "Posting..." : "Post Comment"}
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <SecretActionsMenu secretId={secret.id} />
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button variant="outline" onClick={goToFullPage}>
            <ExternalLink className="h-4 w-4 mr-1" />
            View Full Page
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}

