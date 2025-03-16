"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { setSecrets } from "@/redux/features/secrets/secretsSlice"
import SecretCard from "@/components/secret-card"
import type { Secret } from "@/types/secret"
import { Skeleton } from "@/components/ui/skeleton"
import { secretsApi } from "@/lib/api-client"

export default function SecretTabs() {
  const [activeTab, setActiveTab] = useState("trending")
  const dispatch = useAppDispatch()
  const localSecrets = useAppSelector((state) => state.secrets.secrets)
  const queryClient = useQueryClient()

  // Fetch secrets based on active tab
  const { data, isLoading, error } = useQuery({
    queryKey: ["secrets", activeTab],
    queryFn: async () => {
      try {
        const data = await secretsApi.getSecrets(activeTab, 12)
        return data
      } catch (error) {
        console.error("Error fetching secrets:", error)
        throw error
      }
    },
    staleTime: 60000, // 1 minute
  })

  // Update Redux store when data changes
  useEffect(() => {
    if (data) {
      dispatch(setSecrets(data))
    }
  }, [data, dispatch])

  // Combine local and fetched secrets, removing duplicates
  const secrets = [...localSecrets]

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Force a refetch when switching to the "recent" tab to ensure we have the latest data
    if (value === "recent") {
      queryClient.invalidateQueries({ queryKey: ["secrets", "recent"] })
    }
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">Failed to load secrets. Please try again later.</p>
      </div>
    )
  }

  // Sort secrets based on the active tab
  const getSortedSecrets = (tab: string, secretsToSort: Secret[]) => {
    const sortedSecrets = [...secretsToSort]

    switch (tab) {
      case "dark":
        // Sort by darkness level in descending order (darkest first)
        return sortedSecrets.sort((a, b) => b.darkness - a.darkness)

      case "recent":
        // Sort by creation date in descending order (newest first)
        return sortedSecrets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      case "trending":
        // Sort by a "trending score" that includes darkness level
        return sortedSecrets.sort((a, b) => {
          // Calculate trending score: (views + shares*2 + comments*3) * (darkness/5)
          const aScore = ((a.views || 0) + (a.shares || 0) * 2 + (a.comments?.length || 0) * 3) * (a.darkness / 5)
          const bScore = ((b.views || 0) + (b.shares || 0) * 2 + (b.comments?.length || 0) * 3) * (b.darkness / 5)
          return bScore - aScore // Descending order
        })

      default:
        return sortedSecrets
    }
  }

  return (
    <Tabs defaultValue="trending" value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
        <TabsTrigger value="trending">Trending</TabsTrigger>
        <TabsTrigger value="recent">Most Recent</TabsTrigger>
        <TabsTrigger value="dark">Most Dark</TabsTrigger>
      </TabsList>

      <TabsContent value="trending" className="mt-6">
        <SecretsGrid secrets={getSortedSecrets("trending", secrets)} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="recent" className="mt-6">
        <SecretsGrid secrets={getSortedSecrets("recent", secrets)} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="dark" className="mt-6">
        <SecretsGrid secrets={getSortedSecrets("dark", secrets)} isLoading={isLoading} />
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

