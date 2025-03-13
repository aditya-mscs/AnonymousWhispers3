import Link from "next/link"
import { requireAdmin, getReportedSecrets } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import ReportedSecretsList from "@/components/admin/reported-secrets-list"

export default async function AdminReportsPage() {
  // Check admin session
  requireAdmin()

  // Get reported secrets
  const reportedSecrets = await getReportedSecrets()

  return (
    <div className="container max-w-screen-lg mx-auto py-10">
      <div className="flex items-center mb-8">
        <Link href="/adminportal/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Reported Content</h1>
      </div>

      <ReportedSecretsList initialReportedSecrets={reportedSecrets} />
    </div>
  )
}

