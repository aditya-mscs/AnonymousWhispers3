import { NextResponse } from "next/server"
import { getAwsEnvironment } from "@/lib/aws-env"

export async function GET() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Check if AWS credentials are configured
    const hasAwsCredentials = !!(awsEnv.accessKeyId && awsEnv.secretAccessKey)

    // We'll use a simple fetch to check if we can connect to AWS
    // This avoids importing the AWS SDK directly
    let awsConnected = false

    if (hasAwsCredentials) {
      try {
        // Make a simple fetch request to check AWS connectivity
        // This endpoint should already exist and use AWS SDK on the server side
        const response = await fetch(`${awsEnv.baseUrl}/api/debug/aws-check`, {
          method: "HEAD", // Just check if the endpoint is available, don't need the full response
          cache: "no-store",
        })

        awsConnected = response.ok
      } catch (error) {
        console.error("AWS connection check error:", error)
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
    console.error("Simple status check error:", error)
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

