import Link from "next/link"
import { requireAdmin, getAdminSecrets } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { SocialApprovalDashboard } from "@/components/admin/social-approval-dashboard"
import { qualifiesForSocialSharing } from "@/lib/social-sharing"

export default async function AdminSocialPage() {
  // Check admin session
  requireAdmin()

  // Get secrets for initial render - we'll filter for qualified secrets
  const secretsData = await getAdminSecrets(1, 100) // Get more secrets to filter from

  // Filter secrets that qualify for social sharing
  const qualifiedSecrets = secretsData.secrets.filter((secret) => qualifiesForSocialSharing(secret))

  return (
    <div className="container max-w-screen-lg mx-auto py-10">
      <div className="flex items-center mb-8">
        <Link href="/adminportal/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Social Media Publishing</h1>
      </div>

      <SocialApprovalDashboard initialSecrets={qualifiedSecrets} />
    </div>
  )
}

