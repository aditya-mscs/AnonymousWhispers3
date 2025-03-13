import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand, ScanCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

export async function GET() {
  try {
    console.log("Starting direct DynamoDB access check...")

    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Log environment variables
    console.log("Environment:", {
      region: awsEnv.region,
      hasAccessKey: !!awsEnv.accessKeyId,
      hasSecretKey: !!awsEnv.secretAccessKey,
      secretsTable: awsEnv.secretsTable,
      commentsTable: awsEnv.commentsTable,
    })

    // Initialize the DynamoDB client directly
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    // List tables to verify connection
    console.log("Listing tables...")
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const tableNames = listTablesResponse.TableNames || []

    // Check if our tables exist
    const secretsTableExists = tableNames.includes(awsEnv.secretsTable)

    // If the secrets table exists, try to scan it
    let secretsData = null
    if (secretsTableExists) {
      console.log(`Scanning table: ${awsEnv.secretsTable}`)
      const docClient = DynamoDBDocumentClient.from(client)

      const scanCommand = new ScanCommand({
        TableName: awsEnv.secretsTable,
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
          name: awsEnv.secretsTable,
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

