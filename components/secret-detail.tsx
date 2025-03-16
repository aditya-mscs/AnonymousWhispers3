"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Share2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Secret } from "@/types/secret"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SuperToast } from "@/components/super-toast"
import { getUsernameFromStorage, getUserRating, saveUserRating } from "@/lib/storage"
import { getDarknessTextColor } from "@/lib/utils"
import SecretActionsMenu from "@/components/secret-actions-menu"
import DarknessSlider from "@/components/darkness-slider"
import { SocialSharingNotice } from "@/components/social-sharing-notice"

// Add these imports at the top
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setHasPostedComment } from "@/redux/features/notifications/notificationsSlice"

interface SecretDetailProps {
  secret: Secret
}

export default function SecretDetail({ secret }: SecretDetailProps) {
  const [comment, setComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [tempRating, setTempRating] = useState(0)
  const queryClient = useQueryClient()

  // Remove this line:
  // const [hasPostedComment, setHasPostedComment] = useState(false)

  // Add this line after other hooks:
  const dispatch = useAppDispatch()
  const hasPostedComment = useAppSelector((state) => state.notifications.hasPostedComment)

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
      // Replace: setHasPostedComment(true)
      dispatch(setHasPostedComment(true))
      SuperToast.show({
        message: "Your comment has been added to the secret.",
        type: "success",
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["secret", secret.id] })

      // Mark that a comment has been posted in this session
      sessionStorage.setItem("has_posted_comment", "true")
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

    SuperToast.show({
      message: `You rated this secret ${newRating}/10 for darkness.`,
      type: "success",
    })
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
        SuperToast.show({
          message: "Secret link copied to clipboard!",
          type: "success",
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

  // Sort comments by time (newest first)
  const sortedComments = secret.comments
    ? [...secret.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{secret.username}</div>
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
            </div>
            <div className={`px-3 py-1 ${getDarknessTextColor(secret.darkness)} bg-primary/10 text-sm rounded-full`}>
              Darkness: {secret.darkness}/10
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg whitespace-pre-wrap">{secret.content}</p>
          <div className="mt-4">
            <DarknessSlider
              value={[tempRating]}
              onValueChange={handleRatingChange} // Visual update only
              onValueCommit={handleRatingChangeEnd} // Save only when finished
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-1">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <SecretActionsMenu secretId={secret.id} />
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
          {hasPostedComment && <SocialSharingNotice />}

          {sortedComments && sortedComments.length > 0 ? (
            <div className="space-y-4 mt-6">
              {sortedComments.map((comment, index) => (
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

