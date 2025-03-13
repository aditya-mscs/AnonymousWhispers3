"use client"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MockDataIndicator() {
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAwsStatus() {
      try {
        // Use the simpler status endpoint that doesn't directly use AWS SDK
        const response = await fetch("/api/status/simple")
        const data = await response.json()
        setIsUsingMockData(data.usingMockData === true)
      } catch (error) {
        console.error("Error checking AWS status:", error)
        setIsUsingMockData(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAwsStatus()
  }, [])

  if (isLoading || !isUsingMockData) {
    return null
  }

  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Using Mock Data</AlertTitle>
      <AlertDescription>
        AWS credentials are not configured correctly. The app is using mock data instead.
      </AlertDescription>
    </Alert>
  )
}

