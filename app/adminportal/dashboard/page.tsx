import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { requireAdmin, getAdminStats } from "@/lib/admin"
import { StatsOverview } from "@/components/admin/stats-overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, LogOut, Flag } from "lucide-react"
import { Share2 } from "lucide-react"

export default async function AdminDashboardPage() {
  // Check admin session
  requireAdmin()

  // Get admin stats
  const stats = await getAdminStats()

  return (
    <div className="container max-w-screen-lg mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <form action="/api/adminportal/logout" method="post">
          <Button variant="outline" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </form>
      </div>

      <StatsOverview stats={stats} />

      <div className="grid gap-6 mt-8 md:grid-cols-3">
        <Link href="/adminportal/secrets">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Manage Secrets
              </CardTitle>
              <CardDescription>View, filter, and delete secrets from the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access all secrets shared on the platform. Filter by darkness level, username, or content. Remove
                inappropriate content as needed.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/adminportal/comments">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                Manage Comments
              </CardTitle>
              <CardDescription>View and moderate comments across all secrets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and moderate user comments. Remove inappropriate or harmful content to maintain a safe community
                environment.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/adminportal/reports">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flag className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-500" />
                Reported Content
              </CardTitle>
              <CardDescription>Review content reported by users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Prioritize moderation by reviewing content that users have flagged as inappropriate, harmful, or
                violating community guidelines.
              </p>
              {stats.reportedSecrets > 0 && (
                <div className="mt-2">
                  <Badge variant="destructive">{stats.reportedSecrets} pending reports</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/adminportal/social">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-primary" />
                Social Media Publishing
              </CardTitle>
              <CardDescription>Approve and publish secrets to social media platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and approve high-quality secrets for sharing on Twitter and Instagram to reach a wider audience.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

