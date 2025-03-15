import { NextResponse } from "next/server"
import { checkAdminSession, getReportedSecrets } from "@/lib/admin"

/**
 * GET handler for fetching reported secrets
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Check admin session
    if (!checkAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get reported secrets
    const reportedSecrets = await getReportedSecrets()

    return NextResponse.json({ reportedSecrets })
  } catch (error) {
    console.error("Admin reports error:", error)
    return NextResponse.json({ error: "An error occurred while fetching reported secrets" }, { status: 500 })
  }
}

