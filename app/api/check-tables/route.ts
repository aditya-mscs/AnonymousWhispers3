import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb"

export async function GET() {
  try {
    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })

    const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
    const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

    // List all tables
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    // Check if our tables exist
    const secretsTableExists = allTables.includes(SECRETS_TABLE)
    const commentsTableExists = allTables.includes(COMMENTS_TABLE)

    // Get table details if they exist
    let secretsTableDetails = null
    let commentsTableDetails = null

    if (secretsTableExists) {
      const secretsTableResponse = await client.send(new DescribeTableCommand({ TableName: SECRETS_TABLE }))
      secretsTableDetails = {
        status: secretsTableResponse.Table?.TableStatus,
        itemCount: secretsTableResponse.Table?.ItemCount,
        sizeBytes: secretsTableResponse.Table?.TableSizeBytes,
        creationTime: secretsTableResponse.Table?.CreationDateTime,
      }
    }

    if (commentsTableExists) {
      const commentsTableResponse = await client.send(new DescribeTableCommand({ TableName: COMMENTS_TABLE }))
      commentsTableDetails = {
        status: commentsTableResponse.Table?.TableStatus,
        itemCount: commentsTableResponse.Table?.ItemCount,
        sizeBytes: commentsTableResponse.Table?.TableSizeBytes,
        creationTime: commentsTableResponse.Table?.CreationDateTime,
      }
    }

    return NextResponse.json({
      status: "success",
      awsRegion: process.env.AWS_REGION || "us-east-1",
      hasCredentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      allTables,
      secretsTable: {
        name: SECRETS_TABLE,
        exists: secretsTableExists,
        details: secretsTableDetails,
      },
      commentsTable: {
        name: COMMENTS_TABLE,
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

