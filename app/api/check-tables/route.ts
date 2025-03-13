import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

export async function GET() {
  try {
    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    // List all tables
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    // Check if our tables exist
    const secretsTableExists = allTables.includes(awsEnv.secretsTable)
    const commentsTableExists = allTables.includes(awsEnv.commentsTable)

    // Get table details if they exist
    let secretsTableDetails = null
    let commentsTableDetails = null

    if (secretsTableExists) {
      const secretsTableResponse = await client.send(new DescribeTableCommand({ TableName: awsEnv.secretsTable }))
      secretsTableDetails = {
        status: secretsTableResponse.Table?.TableStatus,
        itemCount: secretsTableResponse.Table?.ItemCount,
        sizeBytes: secretsTableResponse.Table?.TableSizeBytes,
        creationTime: secretsTableResponse.Table?.CreationDateTime,
      }
    }

    if (commentsTableExists) {
      const commentsTableResponse = await client.send(new DescribeTableCommand({ TableName: awsEnv.commentsTable }))
      commentsTableDetails = {
        status: commentsTableResponse.Table?.TableStatus,
        itemCount: commentsTableResponse.Table?.ItemCount,
        sizeBytes: commentsTableResponse.Table?.TableSizeBytes,
        creationTime: commentsTableResponse.Table?.CreationDateTime,
      }
    }

    return NextResponse.json({
      status: "success",
      awsRegion: awsEnv.region,
      hasCredentials: awsEnv.hasCredentials,
      allTables,
      secretsTable: {
        name: awsEnv.secretsTable,
        exists: secretsTableExists,
        details: secretsTableDetails,
      },
      commentsTable: {
        name: awsEnv.commentsTable,
        exists: commentsTableExists,
        details: commentsTableDetails,
      },
    })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

