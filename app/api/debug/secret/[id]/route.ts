import { NextResponse } from "next/server"
import { directGetSecretById, checkTablesExist } from "@/lib/direct-db-access"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("Debug API: Checking tables...")
    const tablesCheck = await checkTablesExist()

    console.log("Debug API: Fetching secret with ID:", params.id)
    const secret = await directGetSecretById(params.id)

    return NextResponse.json({
      tablesCheck,
      secretId: params.id,
      secretFound: !!secret,
      secret,
      env: {
        region: process.env.AWS_REGION,
        secretsTable: process.env.SECRETS_TABLE,
        commentsTable: process.env.COMMENTS_TABLE,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      },
    })
  } catch (error) {
    console.error("Debug API: Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

