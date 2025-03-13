import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

export async function GET() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Check if AWS credentials are configured
    const hasAwsCredentials = awsEnv.hasCredentials

    let awsConnected = false

    if (hasAwsCredentials) {
      try {
        // Try to connect to AWS
        const client = new DynamoDBClient({
          region: awsEnv.region,
          credentials: getAwsCredentials(),
        })

        // List tables to verify connection
        await client.send(new ListTablesCommand({}))
        awsConnected = true
      } catch (error) {
        console.error("AWS connection error:", error)
        awsConnected = false
      }
    }

    return NextResponse.json({
      status: "ok",
      usingMockData: !awsConnected,
      hasAwsCredentials,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      {
        status: "error",
        usingMockData: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

