import { NextResponse } from "next/server"
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"

export async function GET() {
  try {
    console.log("Checking AWS credentials...")

    // Log environment variables (without exposing sensitive values)
    console.log("Environment check:", {
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    })

    // Initialize the STS client to check credentials
    const client = new STSClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })

    // Try to get the caller identity (this will validate the credentials)
    const command = new GetCallerIdentityCommand({})
    const response = await client.send(command)

    return NextResponse.json({
      status: "success",
      identity: {
        account: response.Account,
        arn: response.Arn,
        userId: response.UserId,
      },
      credentials: {
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  } catch (error) {
    console.error("Credentials check error:", error)

    // Return detailed error information
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        credentials: {
          region: process.env.AWS_REGION,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          // Show first few characters of keys for debugging (not the full keys for security)
          accessKeyPreview: process.env.AWS_ACCESS_KEY_ID
            ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 4)}...`
            : null,
          secretKeyLength: process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.length : 0,
        },
      },
      { status: 500 },
    )
  }
}

