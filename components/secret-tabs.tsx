"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { setSecrets } from "@/redux/features/secrets/secretsSlice"
import SecretCard from "@/components/secret-card"
import type { Secret } from "@/types/secret"
import { Skeleton } from "@/components/ui/skeleton"

export default function SecretTabs() {
  const [activeTab, setActiveTab] = useState("recent")
  const dispatch = useAppDispatch()
  const localSecrets = useAppSelector((state) => state.secrets.secrets)

  // Fetch secrets based on active tab
  const { data, isLoading, error } = useQuery({
    queryKey: ["secrets", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/secrets?type=${activeTab}&limit=12`)
      if (!response.ok) {
        throw new Error("Failed to fetch secrets")
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })

  // Update Redux store when data changes
  useEffect(() => {
    if (data?.secrets) {
      dispatch(setSecrets(data.secrets))
    }
  }, [data, dispatch])

  // Combine local and fetched secrets, removing duplicates
  const secrets = [...localSecrets]

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">Failed to load secrets. Please try again later.</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="recent" value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
        <TabsTrigger value="recent">Most Recent</TabsTrigger>
        <TabsTrigger value="dark">Most Dark</TabsTrigger>
        <TabsTrigger value="trending">Trending</TabsTrigger>
      </TabsList>

      <TabsContent value="recent" className="mt-6">
        <SecretsGrid secrets={secrets} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="dark" className="mt-6">
        <SecretsGrid secrets={secrets.sort((a, b) => b.darkness - a.darkness)} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="trending" className="mt-6">
        <SecretsGrid
          secrets={secrets.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))}
          isLoading={isLoading}
        />
      </TabsContent>
    </Tabs>
  )
}

interface SecretsGridProps {
  secrets: Secret[]
  isLoading: boolean
}

function SecretsGrid({ secrets, isLoading }: SecretsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (secrets.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No secrets found. Be the first to share!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {secrets.map((secret) => (
        <SecretCard key={secret.id} secret={secret} />
      ))}
    </div>
  )
}

