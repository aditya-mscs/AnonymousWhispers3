import { NextResponse } from "next/server"
import { reportSecret, hashIp } from "@/lib/db"
import { getUsernameFromStorage } from "@/lib/storage"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { username } = body

    // Get IP address for user identification
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const ipHash = hashIp(ip)

    // Use provided username or get from storage
    const reportUsername = username || getUsernameFromStorage() || "Anonymous"

    // Save the report with a default reason
    const report = await reportSecret({
      secretId: params.id,
      reason: "Content reported by user",
      username: reportUsername,
      ipHash,
      createdAt: new Date(),
    })

    if (!report.success) {
      return NextResponse.json(
        {
          success: false,
          message: report.message || "Failed to submit report",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for reporting this content. Our team will review it shortly.",
    })
  } catch (error) {
    console.error("Error reporting secret:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit report",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

