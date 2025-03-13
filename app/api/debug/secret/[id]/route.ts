import { NextResponse } from "next/server"
import { directGetSecretById, checkTablesExist } from "@/lib/direct-db-access"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("Debug API: Checking tables...")
    const tablesCheck = await checkTablesExist()

    console.log("Debug API: Fetching secret with ID:", params.id)
    const secret = await directGetSecretById(params.id)

    // Get AWS environment variables from the direct-db-access module
    const { getAwsEnvironment } = await import("@/lib/aws-env")
    const awsEnv = getAwsEnvironment()

    return NextResponse.json({
      tablesCheck,
      secretId: params.id,
      secretFound: !!secret,
      secret,
      env: {
        region: awsEnv.region,
        secretsTable: awsEnv.secretsTable,
        commentsTable: awsEnv.commentsTable,
        hasCredentials: awsEnv.hasCredentials,
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

