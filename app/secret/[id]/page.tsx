import { notFound } from "next/navigation"
import SecretDetail from "@/components/secret-detail"
import { secretsApi } from "@/lib/api-client"

// Update the interface to match Next.js 15's PageProps constraint
interface SecretPageProps {
  params: { id: string } | Promise<{ id: string }>
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function SecretPage({ params }: SecretPageProps) {
  try {
    // In Next.js 15, params might be a Promise, so we need to await it
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    console.log("Fetching secret with ID:", id)

    // Fetch the secret using the API client
    const secret = await secretsApi.getSecretById(id)

    if (!secret) {
      console.log("Secret not found, returning 404")
      notFound()
    }

    console.log("Secret found, rendering detail page")
    return <SecretDetail secret={secret} />
  } catch (error) {
    console.error("Error fetching secret:", error)
    // Instead of immediately returning notFound(), let's provide more context
    return (
      <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Error Loading Secret</h1>
        <p className="text-muted-foreground mb-4">
          We encountered an error while trying to load this secret. Please try again later.
        </p>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
          {error instanceof Error ? error.message : "Unknown error"}
        </pre>
      </div>
    )
  }
}

