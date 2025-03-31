import { NextResponse } from "next/server"
import { clearAdminSession } from "@/lib/admin"

export async function POST() {
  clearAdminSession()

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
}

