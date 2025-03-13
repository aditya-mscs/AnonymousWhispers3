import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb"

export async function GET() {
  try {
    console.log("Checking AWS credentials...")

    // Log environment variables (without exposing sensitive values)
    const envCheck = {
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      secretsTable: process.env.SECRETS_TABLE,
      commentsTable: process.env.COMMENTS_TABLE,
    }

    console.log("Environment check:", envCheck)

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })

    // Try to list tables (this will validate the credentials)
    console.log("Listing tables...")
    const command = new ListTablesCommand({})
    const response = await client.send(command)

    return NextResponse.json({
      status: "success",
      tables: response.TableNames || [],
      environment: envCheck,
    })
  } catch (error) {
    console.error("AWS check error:", error)

    // Return detailed error information
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        environment: {
          hasRegion: !!process.env.AWS_REGION,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION,
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

