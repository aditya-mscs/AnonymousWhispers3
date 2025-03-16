"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SuperToast } from "@/components/super-toast"
import { Twitter, Instagram, Save, RefreshCw, CheckCircle } from "lucide-react"

interface SocialCredentials {
  twitter: {
    apiKey: string
    apiSecret: string
    accessToken: string
    accessSecret: string
  }
  instagram: {
    accessToken: string
  }
}

const createConfigTable = async () => {
  try {
    const response = await fetch("/api/setup-config-table")
    return response.ok
  } catch (error) {
    console.error("Error creating config table:", error)
    return false
  }
}

export function SocialMediaConfig() {
  const [credentials, setCredentials] = useState<SocialCredentials>({
    twitter: {
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      accessSecret: "",
    },
    instagram: {
      accessToken: "",
    },
  })

  // Add this state
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingTwitter, setIsTestingTwitter] = useState(false)
  const [isTestingInstagram, setIsTestingInstagram] = useState(false)
  const router = useRouter()

  // Extract the fetchCredentials function from the existing useEffect
  const fetchCredentials = async () => {
    try {
      const response = await fetch("/api/adminportal/social-config")
      if (response.ok) {
        const data = await response.json()
        if (data.credentials) {
          setCredentials(data.credentials)
        }
      }
    } catch (error) {
      console.error("Error fetching credentials:", error)
    }
  }

  // Fetch existing credentials on mount
  useEffect(() => {
    fetchCredentials()
  }, [])

  useEffect(() => {
    // Check if we need to create the config table
    const checkAndCreateTable = async () => {
      try {
        const response = await fetch("/api/adminportal/social-config")
        if (!response.ok && response.status === 500) {
          // Try to create the table
          setIsCreatingTable(true)
          const created = await createConfigTable()
          if (created) {
            SuperToast.show({
              message: "Configuration table created successfully",
              type: "success",
            })
            // Fetch credentials again after table is created
            fetchCredentials()
          } else {
            SuperToast.show({
              message: "Failed to create configuration table",
              type: "error",
            })
          }
          setIsCreatingTable(false)
        }
      } catch (error) {
        console.error("Error checking config table:", error)
        setIsCreatingTable(false)
      }
    }

    checkAndCreateTable()
  }, [])

  // Handle input change
  const handleTwitterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      twitter: {
        ...prev.twitter,
        [name]: value,
      },
    }))
  }

  const handleInstagramInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        [name]: value,
      },
    }))
  }

  // Save credentials
  const handleSaveTwitter = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/adminportal/social-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "twitter",
          credentials: credentials.twitter,
        }),
      })

      if (response.ok) {
        SuperToast.show({
          message: "Twitter credentials saved successfully",
          type: "success",
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to save credentials")
      }
    } catch (error) {
      SuperToast.show({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveInstagram = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/adminportal/social-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "instagram",
          credentials: credentials.instagram,
        }),
      })

      if (response.ok) {
        SuperToast.show({
          message: "Instagram credentials saved successfully",
          type: "success",
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to save credentials")
      }
    } catch (error) {
      SuperToast.show({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test credentials
  const testTwitterCredentials = async () => {
    setIsTestingTwitter(true)
    try {
      const response = await fetch("/api/adminportal/social-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "twitter",
          credentials: credentials.twitter,
        }),
      })

      if (response.ok) {
        SuperToast.show({
          message: "Twitter credentials verified successfully",
          type: "success",
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to verify credentials")
      }
    } catch (error) {
      SuperToast.show({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      })
    } finally {
      setIsTestingTwitter(false)
    }
  }

  const testInstagramCredentials = async () => {
    setIsTestingInstagram(true)
    try {
      const response = await fetch("/api/adminportal/social-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "instagram",
          credentials: credentials.instagram,
        }),
      })

      if (response.ok) {
        SuperToast.show({
          message: "Instagram credentials verified successfully",
          type: "success",
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to verify credentials")
      }
    } catch (error) {
      SuperToast.show({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      })
    } finally {
      setIsTestingInstagram(false)
    }
  }

  return (
    <Tabs defaultValue="twitter">
      {isCreatingTable && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-500" />
            <p className="text-sm text-blue-700 dark:text-blue-300">Creating configuration table... Please wait.</p>
          </div>
        </div>
      )}
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="twitter" className="flex items-center gap-2">
          <Twitter className="h-4 w-4" />
          Twitter
        </TabsTrigger>
        <TabsTrigger value="instagram" className="flex items-center gap-2">
          <Instagram className="h-4 w-4" />
          Instagram
        </TabsTrigger>
      </TabsList>

      <TabsContent value="twitter">
        <Card>
          <CardHeader>
            <CardTitle>Twitter API Configuration</CardTitle>
            <CardDescription>
              Configure your Twitter API credentials to enable automatic posting of approved secrets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key (Consumer Key)</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  value={credentials.twitter.apiKey}
                  onChange={handleTwitterInputChange}
                  placeholder="Enter your Twitter API Key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret Key (Consumer Secret)</Label>
                <Input
                  id="apiSecret"
                  name="apiSecret"
                  type="password"
                  value={credentials.twitter.apiSecret}
                  onChange={handleTwitterInputChange}
                  placeholder="Enter your Twitter API Secret Key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  name="accessToken"
                  value={credentials.twitter.accessToken}
                  onChange={handleTwitterInputChange}
                  placeholder="Enter your Twitter Access Token"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessSecret">Access Token Secret</Label>
                <Input
                  id="accessSecret"
                  name="accessSecret"
                  type="password"
                  value={credentials.twitter.accessSecret}
                  onChange={handleTwitterInputChange}
                  placeholder="Enter your Twitter Access Token Secret"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={testTwitterCredentials}
              disabled={
                isTestingTwitter ||
                !credentials.twitter.apiKey ||
                !credentials.twitter.apiSecret ||
                !credentials.twitter.accessToken ||
                !credentials.twitter.accessSecret
              }
            >
              {isTestingTwitter ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button
              onClick={handleSaveTwitter}
              disabled={
                isLoading ||
                !credentials.twitter.apiKey ||
                !credentials.twitter.apiSecret ||
                !credentials.twitter.accessToken ||
                !credentials.twitter.accessSecret
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Save Credentials
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="instagram">
        <Card>
          <CardHeader>
            <CardTitle>Instagram API Configuration</CardTitle>
            <CardDescription>
              Configure your Instagram API credentials to enable automatic posting of approved secrets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  name="accessToken"
                  value={credentials.instagram.accessToken}
                  onChange={handleInstagramInputChange}
                  placeholder="Enter your Instagram Access Token"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  How to get Instagram Access Token
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal pl-4">
                  <li>
                    Create a Facebook Developer account at{" "}
                    <a
                      href="https://developers.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      developers.facebook.com
                    </a>
                  </li>
                  <li>Create a Facebook App and configure Instagram Basic Display</li>
                  <li>Add Instagram Testers and accept the invitation</li>
                  <li>Generate a long-lived access token using the Instagram Graph API</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={testInstagramCredentials}
              disabled={isTestingInstagram || !credentials.instagram.accessToken}
            >
              {isTestingInstagram ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button onClick={handleSaveInstagram} disabled={isLoading || !credentials.instagram.accessToken}>
              <Save className="h-4 w-4 mr-2" />
              Save Credentials
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

