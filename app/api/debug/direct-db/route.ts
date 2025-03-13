import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand, ScanCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"

export async function GET() {
  try {
    console.log("Starting direct DynamoDB access check...")

    // Log environment variables
    console.log("Environment:", {
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      secretsTable: process.env.SECRETS_TABLE,
      commentsTable: process.env.COMMENTS_TABLE,
    })

    // Initialize the DynamoDB client directly
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })

    // List tables to verify connection
    console.log("Listing tables...")
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const tableNames = listTablesResponse.TableNames || []

    // Check if our tables exist
    const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
    const secretsTableExists = tableNames.includes(SECRETS_TABLE)

    // If the secrets table exists, try to scan it
    let secretsData = null
    if (secretsTableExists) {
      console.log(`Scanning table: ${SECRETS_TABLE}`)
      const docClient = DynamoDBDocumentClient.from(client)

      const scanCommand = new ScanCommand({
        TableName: SECRETS_TABLE,
        Limit: 5,
      })

      const scanResponse = await client.send(scanCommand)
      secretsData = {
        count: scanResponse.Count,
        scannedCount: scanResponse.ScannedCount,
        items: scanResponse.Items,
      }
    }

    return NextResponse.json({
      status: "success",
      tables: {
        all: tableNames,
        secretsTable: {
          name: SECRETS_TABLE,
          exists: secretsTableExists,
        },
      },
      secretsData,
    })
  } catch (error) {
    console.error("Direct DB access error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

