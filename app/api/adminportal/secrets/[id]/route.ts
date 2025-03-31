import { NextResponse } from "next/server"
import { checkAdminSession, deleteSecret } from "@/lib/admin"
import { extractIdFromUrl } from "@/lib/url-utils";

export async function DELETE(request: Request) {
  try {
    // Check admin session
    if (!checkAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the ID from the URL using the request object
    const id = extractIdFromUrl(request.url, -1); // Assuming the ID is the last segment of the URL

    // Delete secret
    const result = await deleteSecret(id!);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete secret" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete secret error:", error)
    return NextResponse.json({ error: "An error occurred while deleting the secret" }, { status: 500 })
  }
}

