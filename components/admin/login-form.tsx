"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SuperToast } from "@/components/super-toast"
import { Shield, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

/**
 * Admin login form component
 * Handles authentication for the admin portal
 */
export function AdminLoginForm() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Check if password is saved in localStorage
    const savedPassword = localStorage.getItem("admin_password")
    if (savedPassword) {
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  /**
   * Handles form submission
   * Authenticates the admin user
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/adminportal/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        // Save password if remember me is checked
        if (rememberMe) {
          localStorage.setItem("admin_password", password)
        } else {
          localStorage.removeItem("admin_password")
        }

        SuperToast.show({
          message: "Login successful!",
          type: "success",
        })
        router.push("/adminportal/dashboard")
        router.refresh()
      } else {
        const data = await response.json()
        SuperToast.show({
          message: data.error || "Invalid password",
          type: "error",
        })
      }
    } catch (error) {
      SuperToast.show({
        message: "An error occurred during login",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
        <CardDescription className="text-center">Enter your admin password to access the dashboard</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                Remember me
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

