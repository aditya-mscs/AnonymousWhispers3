import { NextResponse } from "next/server"
import { getAwsEnvironment } from "@/lib/aws-env"

// Import AWS SDK dynamically only on the server
async function checkAwsConnection() {
  try {
    const awsEnv = getAwsEnvironment()

    // Dynamically import AWS SDK to avoid client-side issues
    const { DynamoDBClient, ListTablesCommand } = await import("@aws-sdk/client-dynamodb")

    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: awsEnv.hasCredentials
        ? {
            accessKeyId: awsEnv.accessKeyId,
            secretAccessKey: awsEnv.secretAccessKey,
          }
        : undefined,
    })

    const command = new ListTablesCommand({})
    const response = await client.send(command)

    return {
      success: true,
      tables: response.TableNames || [],
    }
  } catch (error) {
    console.error("AWS connection check error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function GET() {
  try {
    console.log("Checking AWS credentials...")

    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Log environment variables (without exposing sensitive values)
    const envCheck = {
      hasRegion: !!awsEnv.region,
      hasAccessKey: !!awsEnv.accessKeyId,
      hasSecretKey: !!awsEnv.secretAccessKey,
      region: awsEnv.region,
      secretsTable: awsEnv.secretsTable,
      commentsTable: awsEnv.commentsTable,
    }

    console.log("Environment check:", envCheck)

    // Check AWS connection
    const connectionCheck = await checkAwsConnection()

    return NextResponse.json({
      status: connectionCheck.success ? "success" : "error",
      tables: connectionCheck.success ? connectionCheck.tables : [],
      environment: envCheck,
      connectionError: connectionCheck.success ? null : connectionCheck.error,
    })
  } catch (error) {
    console.error("AWS check error:", error)
    const awsEnv = getAwsEnvironment()

    // Return detailed error information
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        environment: {
          hasRegion: !!awsEnv.region,
          hasAccessKey: !!awsEnv.accessKeyId,
          hasSecretKey: !!awsEnv.secretAccessKey,
          region: awsEnv.region,
          // Show first few characters of keys for debugging (not the full keys for security)
          accessKeyPreview: awsEnv.accessKeyId ? `${awsEnv.accessKeyId.substring(0, 4)}...` : null,
          secretKeyLength: awsEnv.secretAccessKey ? awsEnv.secretAccessKey.length : 0,
        },
      },
      { status: 500 },
    )
  }
}

