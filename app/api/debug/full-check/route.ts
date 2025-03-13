import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

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

    const docClient = DynamoDBDocumentClient.from(client)
    const SECRETS_TABLE = process.env.SECRETS_TABLE || "anonymous-dark-secrets"
    const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "anonymous-dark-secrets-comments"

    // Check AWS credentials
    const credentialsCheck = {
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    }

    // List all tables to verify connection
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    // Check if our tables exist
    const secretsTableExists = allTables.includes(SECRETS_TABLE)
    const commentsTableExists = allTables.includes(COMMENTS_TABLE)

    // Try to scan the secrets table
    let secretsCount = 0
    let secretsSample = []

    if (secretsTableExists) {
      const scanResponse = await docClient.send(
        new ScanCommand({
          TableName: SECRETS_TABLE,
          Limit: 5, // Just get a few items for the sample
        }),
      )

      secretsCount = scanResponse.Count || 0
      secretsSample = scanResponse.Items || []
    }

    // Return comprehensive debug info
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      aws: {
        credentials: credentialsCheck,
        tables: {
          all: allTables,
          secretsTable: {
            name: SECRETS_TABLE,
            exists: secretsTableExists,
          },
          commentsTable: {
            name: COMMENTS_TABLE,
            exists: commentsTableExists,
          },
        },
      },
      data: {
        secretsCount,
        secretsSample: secretsSample.map((item) => ({
          id: item.id,
          username: item.username,
          createdAt: item.createdAt,
          contentPreview: item.content?.substring(0, 50) + "...",
        })),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Full check error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

