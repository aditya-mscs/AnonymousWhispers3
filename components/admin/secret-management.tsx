"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { SuperToast } from "@/components/super-toast"
import { Trash2, Search, AlertTriangle, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getDarknessTextColor } from "@/lib/utils"
import type { Secret } from "@/types/secret"

interface SecretManagementProps {
  initialSecrets: {
    secrets: Secret[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function SecretManagement({ initialSecrets }: SecretManagementProps) {
  const [secrets, setSecrets] = useState(initialSecrets.secrets)
  const [page, setPage] = useState(initialSecrets.page)
  const [totalPages, setTotalPages] = useState(initialSecrets.totalPages)
  const [isLoading, setIsLoading] = useState(false)
  const [filterField, setFilterField] = useState<string>("")
  const [filterValue, setFilterValue] = useState<string>("")
  const router = useRouter()

  const fetchSecrets = async (newPage = page, field = filterField, value = filterValue) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", newPage.toString())

      if (field && value) {
        params.append("filterField", field)
        params.append("filterValue", value)
      }

      const response = await fetch(`/api/admin/secrets?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSecrets(data.secrets)
        setPage(data.page)
        setTotalPages(data.totalPages)
      } else {
        SuperToast.show({
          message: "Failed to fetch secrets",
          type: "error",
        })
      }
    } catch (error) {
      SuperToast.show({
        message: "An error occurred while fetching secrets",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this secret? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/secrets/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        SuperToast.show({
          message: "Secret deleted successfully",
          type: "success",
        })
        // Refresh the list
        fetchSecrets()
        // Refresh the server-side data
        router.refresh()
      } else {
        const data = await response.json()
        SuperToast.show({
          message: data.error || "Failed to delete secret",
          type: "error",
        })
      }
    } catch (error) {
      SuperToast.show({
        message: "An error occurred while deleting the secret",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSecrets(1, filterField, filterValue)
  }

  const handleClearFilter = () => {
    setFilterField("")
    setFilterValue("")
    fetchSecrets(1, "", "")
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchSecrets(newPage)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Secrets</CardTitle>
          <CardDescription>Filter secrets by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="filterField" className="sr-only">
                Filter Field
              </Label>
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger id="filterField">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="darkness">Darkness Level</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="filterValue" className="sr-only">
                Filter Value
              </Label>
              <Input
                id="filterValue"
                placeholder="Filter value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!filterField || !filterValue || isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilter} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Secrets</CardTitle>
          <CardDescription>View and delete secrets from the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : secrets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No secrets found matching your criteria</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Darkness</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {secrets.map((secret) => (
                      <TableRow key={secret.id}>
                        <TableCell className="font-medium">{secret.username}</TableCell>
                        <TableCell className="max-w-xs truncate">{secret.content}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getDarknessTextColor(secret.darkness)} bg-primary/10`}
                          >
                            {secret.darkness}/10
                            {secret.darkness >= 8 && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(secret.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(secret.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page - 1)
                        }}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(pageNum)
                          }}
                          isActive={pageNum === page}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page + 1)
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

