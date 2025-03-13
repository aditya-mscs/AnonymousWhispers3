import { Suspense } from "react"
import SecretInput from "@/components/secret-input"
import SecretTabs from "@/components/secret-tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Share Your Darkest Secrets</h1>
        <p className="text-lg text-muted-foreground">
          A safe space to anonymously share thoughts you've never told anyone. No judgment, no personal data stored.
          Just liberation through confession.
        </p>
      </section>

      <SecretInput />

      <Suspense fallback={<SecretTabsSkeleton />}>
        <SecretTabs />
      </Suspense>
    </div>
  )
}

function SecretTabsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

