import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { getAwsEnvironment, getAwsCredentials } from "@/lib/aws-env"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    // Get AWS environment variables
    const awsEnv = getAwsEnvironment()

    // Initialize the DynamoDB client
    const client = new DynamoDBClient({
      region: awsEnv.region,
      credentials: getAwsCredentials(),
    })

    const docClient = DynamoDBDocumentClient.from(client)

    let result

    if (id) {
      // Get a specific secret
      result = await docClient.send(
        new GetCommand({
          TableName: awsEnv.secretsTable,
          Key: { id },
        }),
      )

      return NextResponse.json({
        id,
        found: !!result.Item,
        item: result.Item || null,
        table: awsEnv.secretsTable,
        region: awsEnv.region,
      })
    } else {
      // List first 10 secrets
      result = await docClient.send(
        new ScanCommand({
          TableName: awsEnv.secretsTable,
          Limit: 10,
        }),
      )

      return NextResponse.json({
        count: result.Items?.length || 0,
        items: result.Items || [],
        table: awsEnv.secretsTable,
        region: awsEnv.region,
      })
    }
  } catch (error) {
    console.error("DB Check Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

