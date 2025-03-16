import { notFound } from "next/navigation"
import SecretDetail from "@/components/secret-detail"
import { secretsApi } from "@/lib/api-client"
import { use } from "react"

interface SecretPageProps {
  params: { id: string } | Promise<{ id: string }>
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function SecretPage({ params }: SecretPageProps) {
  // Use React.use outside of try/catch to synchronously unwrap the Promise
  const resolvedParams = use(Promise.resolve(params))
  const id = resolvedParams.id
  console.log("Fetching secret with ID:", id)

  // Handle potential errors with .catch before passing to use
  const secretPromise = secretsApi.getSecretById(id).catch((error) => {
    console.error("Error fetching secret:", error)
    return null
  })

  // Use React.use to synchronously unwrap the Promise from the API call
  const secret = use(secretPromise)

  if (!secret) {
    console.log("Secret not found, returning 404")
    notFound()
  }

  console.log("Secret found, rendering detail page")
  return <SecretDetail secret={secret} />
}

