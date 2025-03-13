import { notFound } from "next/navigation"
import { SecretDetail } from "@/components/secret-detail"
import { secretsApi } from "@/lib/api-client"

interface SecretPageProps {
  params: {
    id: string
  }
}

export default async function SecretPage({ params }: SecretPageProps) {
  try {
    const secret = await secretsApi.getSecretById(params.id)

    if (!secret) {
      notFound()
    }

    return <SecretDetail secret={secret} />
  } catch (error) {
    console.error("Error fetching secret:", error)
    notFound()
  }
}

