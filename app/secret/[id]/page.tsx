"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { notFound } from "next/navigation"
import SecretDetail from "@/components/secret-detail"
import type { Secret } from "@/types/secret"

export default function SecretPage() {
  const params = useParams()
  const id = params.id as string
  const [secret, setSecret] = useState<Secret | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchSecret() {
      try {
        console.log("Fetching secret with ID:", id)
        const response = await fetch(`/api/secrets/${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch secret")
        }

        const data = await response.json()
        setSecret(data.secret)
      } catch (error) {
        console.error("Error fetching secret:", error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSecret()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Loading secret...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    )
  }

  if (error || !secret) {
    return notFound()
  }

  return <SecretDetail secret={secret} />
}

