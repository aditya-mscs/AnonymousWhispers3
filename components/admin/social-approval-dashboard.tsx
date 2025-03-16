"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SuperToast } from "@/components/super-toast"
import { formatDistanceToNow } from "date-fns"
import { Twitter, Instagram, Share2, AlertTriangle } from "lucide-react"
import { getDarknessTextColor } from "@/lib/utils"
import type { Secret } from "@/types/secret"

interface SocialApprovalDashboardProps {
  initialSecrets: Secret[]
}

export function SocialApprovalDashboard({ initialSecrets }: SocialApprovalDashboardProps) {
  const [secrets, setSecrets] = useState(initialSecrets)
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [sharedSecrets, setSharedSecrets] = useState<Record<string, { twitter: boolean; instagram: boolean }>>({})
  const router = useRouter()

  const handleShare = async (secretId: string, platforms: string[] = ["twitter", "instagram"]) => {
    // Set loading state for this secret
    setIsLoading((prev) => ({ ...prev, [secretId]: true }))

    try {
      const response = await fetch("/api/adminportal/social-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretId,
          platforms,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update shared status
        setSharedSecrets((prev) => ({
          ...prev,
          [secretId]: data.results,
        }))

        SuperToast.show({
          message: "Secret successfully shared on social media!",
          type: "success",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to share secret")
      }
    } catch (error) {
      SuperToast.show({
        message: error instanceof Error ? error.message : "An error occurred while sharing",
        type: "error",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [secretId]: false }))
    }
  }

  const handleShareTwitterOnly = (secretId: string) => handleShare(secretId, ["twitter"])
  const handleShareInstagramOnly = (secretId: string) => handleShare(secretId, ["instagram"])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Publishing</CardTitle>
          <CardDescription>Approve and publish selected secrets to social media platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {secrets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No secrets currently qualify for social media sharing. Secrets need to be substantial (100+ characters)
              and have a darkness rating of at least 6.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Darkness</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secrets.map((secret) => (
                    <TableRow key={secret.id}>
                      <TableCell className="font-medium">{secret.username}</TableCell>
                      <TableCell className="max-w-xs truncate">{secret.content}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getDarknessTextColor(
                            secret.darkness,
                          )} bg-primary/10`}
                        >
                          {secret.darkness}/10
                          {secret.darkness >= 8 && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(secret.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {sharedSecrets[secret.id] ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant={sharedSecrets[secret.id].twitter ? "success" : "outline"} className="w-fit">
                              <Twitter className="h-3 w-3 mr-1" />
                              {sharedSecrets[secret.id].twitter ? "Shared" : "Not shared"}
                            </Badge>
                            <Badge
                              variant={sharedSecrets[secret.id].instagram ? "success" : "outline"}
                              className="w-fit"
                            >
                              <Instagram className="h-3 w-3 mr-1" />
                              {sharedSecrets[secret.id].instagram ? "Shared" : "Not shared"}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline">Not shared</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleShare(secret.id)}
                            disabled={
                              isLoading[secret.id] ||
                              (sharedSecrets[secret.id]?.twitter && sharedSecrets[secret.id]?.instagram)
                            }
                          >
                            {isLoading[secret.id] ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            ) : (
                              <Share2 className="h-4 w-4 mr-2" />
                            )}
                            Share All
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleShareTwitterOnly(secret.id)}
                              disabled={isLoading[secret.id] || sharedSecrets[secret.id]?.twitter}
                            >
                              <Twitter className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleShareInstagramOnly(secret.id)}
                              disabled={isLoading[secret.id] || sharedSecrets[secret.id]?.instagram}
                            >
                              <Instagram className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

