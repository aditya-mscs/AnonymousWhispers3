"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import { SuperToast } from "@/components/super-toast"

interface ReportedSecretsListProps {
  initialReportedSecrets: any[]
}

export default function ReportedSecretsList({ initialReportedSecrets }: ReportedSecretsListProps) {
  const [reportedSecrets, setReportedSecrets] = useState(initialReportedSecrets)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSecretId, setExpandedSecretId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (secretId: string) => {
    if (!confirm("Are you sure you want to delete this secret? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/secrets/${secretId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        SuperToast.show({
          message: "Secret deleted successfully",
          type: "success",
        })

        // Remove the deleted secret from the list
        setReportedSecrets(reportedSecrets.filter((item) => item.secret.id !== secretId))

        // Refresh the server-side data
        router.refresh()
      } else {
        const data = await response.json()
        SuperToast.show({
          message: data.error || "Failed to delete secret",
          type: "error",
        })
      }
    } catch (error) {
      SuperToast.show({
        message: "An error occurred while deleting the secret",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissReport = async (secretId: string) => {
    // In a real implementation, you would update the report status in the database
    SuperToast.show({
      message: "Report dismissed",
      type: "success",
    })

    // Remove the secret from the list
    setReportedSecrets(reportedSecrets.filter((item) => item.secret.id !== secretId))
  }

  const toggleExpand = (secretId: string) => {
    if (expandedSecretId === secretId) {
      setExpandedSecretId(null)
    } else {
      setExpandedSecretId(secretId)
    }
  }

  if (reportedSecrets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reported Content</CardTitle>
          <CardDescription>No reported content found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">There are currently no reported secrets to review.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reported Content</CardTitle>
        <CardDescription>Review and moderate reported secrets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reportedSecrets.map((item) => (
            <Card key={item.secret.id} className="border-amber-200 dark:border-amber-800 overflow-hidden">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/20 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {item.reportCount} {item.reportCount === 1 ? "report" : "reports"}
                      </Badge>
                      <span className="text-sm font-medium">Posted by {item.secret.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.secret.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-sm">
                        Darkness: {item.secret.darkness}/10
                        {item.secret.darkness >= 8 && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismissReport(item.secret.id)}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.secret.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Secret content */}
                <div className="p-3 bg-muted/30 rounded-md mb-4">
                  <p className="whitespace-pre-wrap">{item.secret.content}</p>
                </div>

                {/* Toggle button for reports */}
                <Button variant="outline" size="sm" onClick={() => toggleExpand(item.secret.id)} className="mb-2">
                  {expandedSecretId === item.secret.id ? "Hide Reports" : "Show Reports"}
                </Button>

                {/* Reports list */}
                {expandedSecretId === item.secret.id && (
                  <div className="mt-3 border rounded-md overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 font-medium text-sm">Report Details</div>
                    <div className="divide-y">
                      {item.reports.map((report: any) => (
                        <div key={report.id} className="p-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{report.username}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">
                            <span className="font-medium">Reason:</span> {report.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

