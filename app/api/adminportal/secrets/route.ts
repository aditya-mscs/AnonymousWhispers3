import { NextResponse } from "next/server"
import { checkAdminSession, getAdminSecrets } from "@/lib/admin"

export async function GET(request: Request) {
  try {
    // Check admin session
    if (!checkAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10)

    // Get filter parameters
    const filterField = url.searchParams.get("filterField") || undefined
    const filterValue = url.searchParams.get("filterValue") || undefined

    const filter = filterField && filterValue ? { field: filterField, value: filterValue } : undefined

    // Get secrets
    const result = await getAdminSecrets(page, limit, filter)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin secrets error:", error)
    return NextResponse.json({ error: "An error occurred while fetching secrets" }, { status: 500 })
  }
}

