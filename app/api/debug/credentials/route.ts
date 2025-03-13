import { NextResponse } from "next/server"
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

export async function GET() {
  try {
    console.log("Checking AWS credentials...")

    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Log environment variables (without exposing sensitive values)
    console.log("Environment check:", {
      hasRegion: !!awsEnv.region,
      hasAccessKey: !!awsEnv.accessKeyId,
      hasSecretKey: !!awsEnv.secretAccessKey,
      region: awsEnv.region,
    })

    // Initialize the STS client to check credentials
    const client = new STSClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
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
        region: awsEnv.region,
        hasAccessKey: !!awsEnv.accessKeyId,
        hasSecretKey: !!awsEnv.secretAccessKey,
      },
    })
  } catch (error) {
    console.error("Credentials check error:", error)

    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Return detailed error information
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        credentials: {
          region: awsEnv.region,
          hasAccessKey: !!awsEnv.accessKeyId,
          hasSecretKey: !!awsEnv.secretAccessKey,
          // Show first few characters of keys for debugging (not the full keys for security)
          accessKeyPreview: awsEnv.accessKeyId ? `${awsEnv.accessKeyId.substring(0, 4)}...` : null,
          secretKeyLength: awsEnv.secretAccessKey ? awsEnv.secretAccessKey.length : 0,
        },
      },
      { status: 500 },
    )
  }
}

