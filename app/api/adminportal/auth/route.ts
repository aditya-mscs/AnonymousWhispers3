import { NextResponse } from "next/server"
import { verifyAdminPassword, setAdminSession } from "@/lib/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Set admin session
    setAdminSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json({ error: "An error occurred during authentication" }, { status: 500 })
  }
}

