import { notFound } from "next/navigation"
import { SecretDetail } from "@/components/secret-detail"
import { getSecretById } from "@/lib/api"

interface SecretPageProps {
  params: {
    id: string
  }
}

export default async function SecretPage({ params }: SecretPageProps) {
  try {
    const secret = await getSecretById(params.id)

    if (!secret) {
      notFound()
    }

    return <SecretDetail secret={secret} />
  } catch (error) {
    console.error("Error fetching secret:", error)
    notFound()
  }
}

