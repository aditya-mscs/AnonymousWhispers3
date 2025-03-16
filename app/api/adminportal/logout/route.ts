import { NextResponse } from "next/server"
import { clearAdminSession } from "@/lib/admin"

export async function POST() {
  clearAdminSession()

  // Clear saved admin password
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("admin_password")
  }

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
}

