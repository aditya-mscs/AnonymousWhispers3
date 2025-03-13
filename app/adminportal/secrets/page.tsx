import Link from "next/link"
import { requireAdmin, getAdminSecrets } from "@/lib/admin"
import { SecretManagement } from "@/components/admin/secret-management"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function AdminSecretsPage() {
  // Check admin session
  requireAdmin()

  // Get secrets for initial render
  const secretsData = await getAdminSecrets()

  return (
    <div className="container max-w-screen-lg mx-auto py-10">
      <div className="flex items-center mb-8">
        <Link href="/adminportal/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Manage Secrets</h1>
      </div>

      <SecretManagement initialSecrets={secretsData} />
    </div>
  )
}

