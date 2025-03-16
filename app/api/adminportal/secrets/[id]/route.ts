import { NextResponse } from "next/server"
import { checkAdminSession, deleteSecret } from "@/lib/admin"

export async function DELETE(request: Request) {
  try {
    // Check admin session
    if (!checkAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the ID from the URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const id = pathParts[pathParts.length - 1]

    if (!id) {
      return NextResponse.json({ error: "Secret ID is required" }, { status: 400 })
    }

    // Delete secret
    const result = await deleteSecret(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete secret" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete secret error:", error)
    return NextResponse.json({ error: "An error occurred while deleting the secret" }, { status: 500 })
  }
}

