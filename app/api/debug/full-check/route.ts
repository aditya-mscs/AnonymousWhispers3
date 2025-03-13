import { NextResponse } from "next/server"
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
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

    const docClient = DynamoDBDocumentClient.from(client)

    // Check AWS credentials
    const credentialsCheck = {
      hasRegion: !!awsEnv.region,
      hasAccessKey: !!awsEnv.accessKeyId,
      hasSecretKey: !!awsEnv.secretAccessKey,
      region: awsEnv.region,
    }

    // List all tables to verify connection
    const listTablesResponse = await client.send(new ListTablesCommand({}))
    const allTables = listTablesResponse.TableNames || []

    // Check if our tables exist
    const secretsTableExists = allTables.includes(awsEnv.secretsTable)
    const commentsTableExists = allTables.includes(awsEnv.commentsTable)

    // Try to scan the secrets table
    let secretsCount = 0
    let secretsSample = []

    if (secretsTableExists) {
      const scanResponse = await docClient.send(
        new ScanCommand({
          TableName: awsEnv.secretsTable,
          Limit: 5, // Just get a few items for the sample
        }),
      )

      secretsCount = scanResponse.Count || 0
      secretsSample = scanResponse.Items || []
    }

    // Return comprehensive debug info
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      baseUrl: awsEnv.baseUrl,
      aws: {
        credentials: credentialsCheck,
        tables: {
          all: allTables,
          secretsTable: {
            name: awsEnv.secretsTable,
            exists: secretsTableExists,
          },
          commentsTable: {
            name: awsEnv.commentsTable,
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

