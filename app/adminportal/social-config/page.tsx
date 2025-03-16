import Link from "next/link"
import { requireAdmin } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { SocialMediaConfig } from "@/components/admin/social-media-config"

export default async function SocialConfigPage() {
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
        <h1 className="text-3xl font-bold ml-4">Social Media Configuration</h1>
      </div>

      <SocialMediaConfig />
    </div>
  )
}

