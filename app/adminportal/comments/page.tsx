import Link from "next/link"
import { requireAdmin } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminCommentsPage() {
  // Check admin session
  requireAdmin()

  return (
    <div className="container max-w-screen-lg mx-auto py-10">
      <div className="flex items-center mb-8">
        <Link href="/adminportal/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Manage Comments</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comments Management</CardTitle>
          <CardDescription>
            This feature is coming soon. You'll be able to view and moderate comments across all secrets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            In the meantime, you can manage comments by deleting their parent secrets in the Secrets Management section.
          </p>
          <div className="mt-4">
            <Link href="/adminportal/secrets">
              <Button>Go to Secrets Management</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

