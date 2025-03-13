import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SecretNotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
      <h1 className="text-4xl font-bold">Secret Not Found</h1>
      <p className="text-xl text-muted-foreground">
        The secret you're looking for doesn't exist or may have been removed.
      </p>
      <div className="flex justify-center gap-4 mt-8">
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/about">Learn More</Link>
        </Button>
      </div>
    </div>
  )
}

