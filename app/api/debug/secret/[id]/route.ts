import { NextResponse } from "next/server"
import { directGetSecretById, checkTablesExist } from "@/lib/direct-db-access"
import { extractLastSegment } from "@/lib/url-utils"

export async function GET(request: Request) {
  try {
    console.log("Debug API: Checking tables...")
    const tablesCheck = await checkTablesExist()

    const secret = await extractLastSegment(request.url)
    console.log("Debug API: Fetching secret with ID:", secret)

    // Get AWS environment variables from the direct-db-access module
    const { getAwsEnvironment } = await import("@/lib/aws-env")
    const awsEnv = getAwsEnvironment()

    return NextResponse.json({
      tablesCheck,
      secretId: secret,
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

