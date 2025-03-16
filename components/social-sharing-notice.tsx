"use client"
import { useAppSelector } from "@/redux/hooks"

export function SocialSharingNotice() {
  const hasPostedComment = useAppSelector((state) => state.notifications.hasPostedComment)

  if (!hasPostedComment) return null

  return (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <p className="text-sm text-blue-700 dark:text-blue-300">
        <span className="font-medium">Note:</span> High-quality secrets may be shared anonymously on our social media
        platforms to reach a wider audience. Your identity will never be revealed.
      </p>
    </div>
  )
}

