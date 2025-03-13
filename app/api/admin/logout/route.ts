import { NextResponse } from "next/server"
import { clearAdminSession } from "@/lib/admin"

// Make sure we're exporting the handler function correctly
export async function POST() {
  clearAdminSession()
  // Use NextResponse.redirect with the correct URL
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
}

